const state = {
  location: START,
  player: null,
  luckResult: null,
  monsterSeconds: null,
  message: ""
};

let monsterTimerId = null;

function stopMonsterTimer() {
  if (monsterTimerId !== null) clearInterval(monsterTimerId);
  monsterTimerId = null;
  state.monsterSeconds = null;
}

function startMonsterTimer() {
  stopMonsterTimer();
  const timerLocation = state.location;
  const location = LOCATIONS[timerLocation];
  state.monsterSeconds = location.timeLimit;
  monsterTimerId = setInterval(() => {
    if (state.location !== timerLocation) return stopMonsterTimer();
    state.monsterSeconds -= 1;
    if (state.monsterSeconds <= 0) {
      stopMonsterTimer();
      return navigateToLocation(location.timeoutTarget);
    }
    renderMonsterTimer();
  }, 1000);
}

function navigateToLocation(target, message = "", luckResult = null) {
  if (!LOCATIONS[target]) throw new Error(`Unknown location: ${target}`);

  stopBattle();
  cancelLuckCheck();
  if (LOCATIONS[state.location].timeLimit) stopMonsterTimer();
  resetInventoryAfterNavigation();
  state.location = target;
  state.message = message;
  state.luckResult = luckResult;

  if (LOCATIONS[state.location].timeLimit) startMonsterTimer();
  render();
}

function resetAdventure() {
  stopBattle();
  cancelLuckCheck();
  stopMonsterTimer();
  state.location = START;
  resetInventory();
  state.player = null;
  characterSetup.reset();
  state.luckResult = null;
  state.message = "";
  render();
}

function choose(choice) {
  if (!state.player || pendingLuck) return;
  // Ignore stale buttons so one attempt cannot spend Luck twice.
  if (!LOCATIONS[state.location].choices.includes(choice)) return;
  if (choice.restart) return resetAdventure();
  if (choice.action === "testLuck") {
    return beginLuckCheck(choice);
  }
  if (choice.action === "searchChest") return beginChestSelection();
  if (choice.action === "continueSP1") {
    const target = state.sp1TorchReady ? choice.successTarget : choice.target;
    return navigateToLocation(target);
  }
  return navigateToLocation(choice.target);
}

function examineCurrentLocation() {
  const location = LOCATIONS[state.location];
  if (location.ending) return;

  closeInventoryModes();
  if (location.examineTarget) {
  if (!LOCATIONS[location.examineTarget]) {
    throw new Error(`Unknown examine location: ${location.examineTarget}`);
  }

  if (location.examineTarget === "GOLD_COINS" && !state.inventory.includes("gold")) {
    state.inventory.push("gold");
  }

  return navigateToLocation(location.examineTarget);
}
  

  state.message = "You search but find nothing.";
  render();
}

function setupNavigationControls() {
  document.getElementById("examineButton").onclick = examineCurrentLocation;
}
