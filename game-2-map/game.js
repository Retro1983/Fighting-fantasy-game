function renderMonsterTimer() {
  const timer = document.getElementById("monsterTimer");
  const isActive = Boolean(LOCATIONS[state.location].timeLimit) && state.monsterSeconds !== null;
  timer.hidden = !isActive;
  if (isActive) document.getElementById("monsterSeconds").textContent = state.monsterSeconds;
}

function render() {
  document.getElementById("characterSetup").hidden = Boolean(state.player);
  document.getElementById("adventure").hidden = !state.player;
  if (!state.player) return;
  const location = LOCATIONS[state.location];
  const artId = state.location === "SP1" && state.sp1TorchReady
    ? location.torchArtId
    : location.artId;
  const artwork = ARTWORK[artId];
  const choicesToShow = pendingLuck ? [{ label: "STOP", stopLuck: true }] : visibleChoices(location);

  const scene = document.getElementById("scene");
  scene.src = artwork.file;
  scene.alt = `${artwork.label} artwork`;
  document.getElementById("locationName").textContent = state.chestMode ? "Inside the Chest" : location.title;

  let storyText;
  if (state.chestMode) {
    storyText = "Inside the chest you find a glowing torch, a sword, Fool's Gold. You may choose only two.";
  } else if (state.location === "SP1" && state.sp1TorchReady) {
    storyText = location.torchText;
  } else {
  storyText = location.text;

  if (state.location === "FREEDOM" && !state.inventory.includes("gold")) {
    storyText += " Congratulations! You escaped, but failed to find the gold.";
  }
}

if (state.message) storyText += ` ${state.message}`;
  document.getElementById("storyText").textContent = storyText;
  const luckPanel = document.getElementById("luckResult");
  const luck = state.luckResult;
  document.getElementById("luckDice").hidden = !pendingLuck && !luck;
  luckPanel.hidden = !luck && !location.choices.some(choice => choice.action === "testLuck");
  luckPanel.textContent = pendingLuck
    ? `Current LUCK: ${state.player.getState().current.luck}. Press STOP to reveal your two dice and attempt the jump.`
    : luck
    ? `Test Your Luck: ${luck.values.join(" + ")} = ${luck.total}. LUCK used: ${luck.luckUsed}. ${luck.successful ? "Successful" : "Unsuccessful"}. New LUCK: ${luck.luckAfter}.`
    : `Current LUCK: ${state.player.getState().current.luck}. Roll equal to or below this to succeed. Every test costs 1 LUCK.`;
  renderMonsterTimer();
  document.getElementById("choiceHeading").hidden = choicesToShow.length === 0;

  const choices = document.getElementById("choiceButtons");
  choices.replaceChildren(...choicesToShow.map((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.innerHTML = `<span class="choice-number">${index + 1}.</span>${choice.label}`;
    button.onclick = () => choice.stopLuck ? stopLuckCheck() : choice.itemId ? takeChestItem(choice.itemId) : choose(choice);
    return button;
  }));

  renderInventory();
}

setupLuckCheck();
setupCharacterCreation();
setupNavigationControls();
setupInventoryControls();
render();
