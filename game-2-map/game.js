// Presentation state only: never changes location data or character rules.
let storyPage = 0;
let storyPageKey = '';
function changeStoryPage(delta) {
  storyPage += delta;
  render();
  document.getElementById("activityPanel").scrollTop = 0;
}

function renderPlayerStats() {
  const panel = document.getElementById("playerStats");
  panel.hidden = !state.player;
  if (!state.player) return;
  const { current } = state.player.getState();
  document.getElementById("playerSkill").textContent = current.skill;
  document.getElementById("playerStamina").textContent = current.stamina;
  document.getElementById("playerLuck").textContent = current.luck;
}

function renderMonsterTimer() {
  const timer = document.getElementById("monsterTimer");
  const isActive = Boolean(LOCATIONS[state.location].timeLimit) && state.monsterSeconds !== null;
  timer.hidden = !isActive;
  if (isActive) document.getElementById("monsterSeconds").textContent = state.monsterSeconds;
}

function render() {
  renderPlayerStats();
  document.getElementById("characterSetup").hidden = Boolean(state.player);
  document.getElementById("adventure").hidden = !state.player;
  syncBattle();
  if (!state.player) { storyPageKey = ""; return; }
  const location = LOCATIONS[state.location];
  const artId = state.location === "SP1" && state.sp1TorchReady
    ? location.torchArtId
    : location.artId;
  const artwork = ARTWORK[artId];
  let choicesToShow = pendingLuck ? [] : visibleChoices(location);

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
  }

  const pageKey = `${state.location}:${state.chestMode}:${state.sp1TorchReady}`;
  if (storyPageKey !== pageKey) {
    storyPage = 0;
    storyPageKey = pageKey;
    document.getElementById("activityPanel").scrollTop = 0;
  }
  const pages = !state.chestMode && !state.sp1TorchReady && Array.isArray(location.pages) && location.pages.length
    ? location.pages : [storyText];
  storyPage = Math.max(0, Math.min(storyPage, pages.length - 1));
  storyText = pages[storyPage];
  if (state.location === "FREEDOM" && !state.inventory.includes("gold") && storyPage === pages.length - 1) {
    storyText += " Congratulations! You escaped, but failed to find the gold.";
  }
  if (state.message) storyText += ` ${state.message}`;
  const encounterVisible = !document.getElementById("battle").hidden;
  document.getElementById("activityMessage").hidden = !encounterVisible || !state.message;
  document.getElementById("activityMessage").textContent = state.message;
  document.getElementById("storyContent").hidden = Boolean(pendingLuck) || encounterVisible;
  document.getElementById("luckContent").hidden = !pendingLuck;
  document.getElementById("stopLuckButton").hidden = !pendingLuck;
  document.getElementById("activityPanel").setAttribute("data-activity", encounterVisible ? "encounter" : pendingLuck ? "luck" : "story");
  document.getElementById("storyPager").hidden = pages.length < 2;
  document.getElementById("pageIndicator").textContent = `${storyPage + 1} / ${pages.length}`;
  document.getElementById("previousPage").disabled = storyPage === 0;
  document.getElementById("nextPage").disabled = storyPage === pages.length - 1;
  if (!pendingLuck && !encounterVisible && storyPage < pages.length - 1) choicesToShow = [];
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
  document.getElementById("choiceHeading").hidden = choicesToShow.length === 0 || encounterVisible || Boolean(pendingLuck);

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

document.getElementById("stopLuckButton").onclick = stopLuckCheck;
document.getElementById("previousPage").onclick = () => changeStoryPage(-1);
document.getElementById("nextPage").onclick = () => changeStoryPage(1);
setupLuckCheck();
setupCharacterCreation();
setupNavigationControls();
setupInventoryControls();
render();
document.documentElement?.classList.remove("game-2-starting");
