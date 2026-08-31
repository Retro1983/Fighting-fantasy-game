const state = {
  location: START,
  inventory: [],
  chestMode: false,
  chestSearched: false,
  useMode: false,
  sp1TorchReady: false,
  monsterSeconds: null,
  message: ""
};

let monsterTimerId = null;

function stopMonsterTimer() {
  if (monsterTimerId !== null) clearInterval(monsterTimerId);
  monsterTimerId = null;
  state.monsterSeconds = null;
}

function renderMonsterTimer() {
  const timer = document.getElementById("monsterTimer");
  const isActive = state.location === "MONSTER" && state.monsterSeconds !== null;
  timer.hidden = !isActive;
  if (isActive) document.getElementById("monsterSeconds").textContent = state.monsterSeconds;
}

function startMonsterTimer() {
  stopMonsterTimer();
  const monster = LOCATIONS.MONSTER;
  state.monsterSeconds = monster.timeLimit;
  monsterTimerId = setInterval(() => {
    if (state.location !== "MONSTER") return stopMonsterTimer();
    state.monsterSeconds -= 1;
    if (state.monsterSeconds <= 0) {
      stopMonsterTimer();
      state.location = monster.timeoutTarget;
      state.chestMode = false;
      state.useMode = false;
      state.message = "";
      return render();
    }
    renderMonsterTimer();
  }, 1000);
}

function resetAdventure() {
  stopMonsterTimer();
  state.location = START;
  state.inventory = [];
  state.chestMode = false;
  state.chestSearched = false;
  state.useMode = false;
  state.sp1TorchReady = false;
  state.message = "";
  render();
}

function choose(choice) {
  if (choice.restart) return resetAdventure();
  if (choice.action === "searchChest") {
    state.chestMode = true;
    state.message = "Choose two items to place in your inventory.";
    return render();
  }
  if (choice.action === "continueSP1") {
    state.location = state.sp1TorchReady ? "DA3" : "DEATH2";
    state.sp1TorchReady = false;
    state.useMode = false;
    state.message = "";
    return render();
  }
  if (!LOCATIONS[choice.target]) throw new Error(`Unknown location: ${choice.target}`);
  if (state.location === "MONSTER") stopMonsterTimer();
  if (state.location === "SP1") state.sp1TorchReady = false;
  state.location = choice.target;
  state.chestMode = false;
  state.useMode = false;
  state.message = "";
  if (state.location === "MONSTER") startMonsterTimer();
  render();
}

function takeChestItem(itemId) {
  if (!ITEMS[itemId] || state.inventory.includes(itemId) || state.inventory.length >= 2) return;
  state.inventory.push(itemId);
  state.useMode = false;

  if (state.inventory.length === 2) {
    state.chestMode = false;
    state.chestSearched = true;
    state.message = `You place the ${ITEMS[state.inventory[0]].name} and the ${ITEMS[state.inventory[1]].name} in your inventory.`;
  } else {
    state.message = `You take the ${ITEMS[itemId].name}. Choose one more item.`;
  }
  render();
}

function visibleChoices(location) {
  if (state.chestMode) {
    return Object.entries(ITEMS)
      .filter(([itemId]) => !state.inventory.includes(itemId))
      .map(([itemId, item]) => ({ label: item.name, itemId }));
  }
  if (state.location === "CH1" && state.chestSearched) {
    return location.choices.filter(choice => choice.action !== "searchChest");
  }
  return location.choices;
}

function renderInventory() {
  document.getElementById("inventoryCount").textContent = `${state.inventory.length}/2`;
  [0, 1].forEach(index => {
    const itemId = state.inventory[index];
    document.getElementById(`inventoryItem${index + 1}`).textContent = itemId ? ITEMS[itemId].name : "Empty";
    const slot = document.querySelector(`[data-inventory-slot="${index}"]`);
    slot.disabled = !itemId;
    slot.classList.toggle("use-ready", state.useMode && Boolean(itemId));
  });
  document.getElementById("useButton").disabled = state.inventory.length === 0;
  document.getElementById("useButton").classList.toggle("active", state.useMode);
  document.getElementById("examineButton").disabled = LOCATIONS[state.location].ending === true;
  document.getElementById("clearInventoryButton").disabled = state.inventory.length === 0;
}

function render() {
  const location = LOCATIONS[state.location];
  const artId = state.location === "SP1" && state.sp1TorchReady
    ? location.torchArtId
    : location.artId;
  const artwork = ARTWORK[artId];
  const choicesToShow = visibleChoices(location);

  const scene = document.getElementById("scene");
  scene.src = artwork.file;
  scene.alt = `${artwork.label} artwork`;
  document.getElementById("locationName").textContent = state.chestMode ? "Inside the Chest" : location.title;

  let storyText;
  if (state.chestMode) {
    storyText = "Inside the chest you find a glowing torch, a sword, and a bag full of gold coins. You may choose only two.";
  } else if (state.location === "SP1" && state.sp1TorchReady) {
    storyText = location.torchText;
  } else {
    storyText = location.text;
  }
  if (state.message) storyText += ` ${state.message}`;
  document.getElementById("storyText").textContent = storyText;
  renderMonsterTimer();
  document.getElementById("choiceHeading").hidden = choicesToShow.length === 0;

  const choices = document.getElementById("choiceButtons");
  choices.replaceChildren(...choicesToShow.map((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.innerHTML = `<span class="choice-number">${index + 1}.</span>${choice.label}`;
    button.onclick = () => choice.itemId ? takeChestItem(choice.itemId) : choose(choice);
    return button;
  }));

  renderInventory();
}

document.getElementById("inventoryButton").onclick = () => {
  const panel = document.getElementById("inventoryPanel");
  panel.hidden = !panel.hidden;
  document.getElementById("inventoryButton").setAttribute("aria-expanded", String(!panel.hidden));
};

document.getElementById("useButton").onclick = () => {
  if (state.inventory.length === 0) return;
  state.useMode = true;
  state.message = "Choose Item 1 or Item 2.";
  const panel = document.getElementById("inventoryPanel");
  panel.hidden = false;
  document.getElementById("inventoryButton").setAttribute("aria-expanded", "true");
  render();
};

document.getElementById("examineButton").onclick = () => {
  const location = LOCATIONS[state.location];
  if (location.ending) return;

  state.chestMode = false;
  state.useMode = false;
  if (location.examineTarget) {
    if (!LOCATIONS[location.examineTarget]) throw new Error(`Unknown examine location: ${location.examineTarget}`);
    state.location = location.examineTarget;
    state.message = "";
  } else {
    state.message = "You search but find nothing.";
  }
  render();
};

document.querySelectorAll("[data-inventory-slot]").forEach(slot => {
  slot.onclick = () => {
    const itemId = state.inventory[Number(slot.dataset.inventorySlot)];
    if (!itemId) return;
    if (state.useMode) {
      state.useMode = false;
      if (state.location === "SP1" && itemId === "torch") {
        state.sp1TorchReady = true;
        state.message = "";
      } else if (state.location === "SP1") {
        state.sp1TorchReady = false;
        state.message = `You ready the ${ITEMS[itemId].name}, but the passage remains dangerously dark.`;
      } else if (state.location === "MONSTER" && itemId === "sword") {
        stopMonsterTimer();
        state.location = "MONSTER_DEATH";
        state.message = "";
      } else if (state.location === "MONSTER") {
        state.message = `The ${ITEMS[itemId].name} cannot stop the hungry monster.`;
      } else {
        state.message = `The ${ITEMS[itemId].name} won't work here.`;
      }
    } else {
      state.message = `This is your ${ITEMS[itemId].name}.`;
    }
    render();
  };
});

document.getElementById("clearInventoryButton").onclick = () => {
  state.inventory = [];
  state.chestMode = false;
  state.chestSearched = false;
  state.useMode = false;
  state.sp1TorchReady = false;
  state.message = state.location === "CH1"
    ? "Your inventory is empty. You may search the chest and choose again."
    : "Your inventory is now empty.";
  render();
};

render();
