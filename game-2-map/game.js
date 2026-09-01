function renderMonsterTimer() {
  const timer = document.getElementById("monsterTimer");
  const isActive = Boolean(LOCATIONS[state.location].timeLimit) && state.monsterSeconds !== null;
  timer.hidden = !isActive;
  if (isActive) document.getElementById("monsterSeconds").textContent = state.monsterSeconds;
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

setupNavigationControls();
setupInventoryControls();
render();
