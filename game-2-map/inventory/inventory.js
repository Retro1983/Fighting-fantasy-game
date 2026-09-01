Object.assign(state, {
  inventory: [],
  chestMode: false,
  chestSearched: false,
  useMode: false,
  sp1TorchReady: false
});

function closeInventoryModes() {
  state.chestMode = false;
  state.useMode = false;
}

function resetInventoryAfterNavigation() {
  closeInventoryModes();
  state.sp1TorchReady = false;
}

function resetInventory() {
  state.inventory = [];
  state.chestMode = false;
  state.chestSearched = false;
  state.useMode = false;
  state.sp1TorchReady = false;
}

function beginChestSelection() {
  state.chestMode = true;
  state.message = "Choose two items to place in your inventory.";
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

function toggleInventoryPanel() {
  const panel = document.getElementById("inventoryPanel");
  panel.hidden = !panel.hidden;
  document.getElementById("inventoryButton").setAttribute("aria-expanded", String(!panel.hidden));
}

function beginUsingInventoryItem() {
  if (state.inventory.length === 0) return;
  state.useMode = true;
  state.message = "Choose Item 1 or Item 2.";
  const panel = document.getElementById("inventoryPanel");
  panel.hidden = false;
  document.getElementById("inventoryButton").setAttribute("aria-expanded", "true");
  render();
}

function selectInventoryItem(slotIndex) {
  const itemId = state.inventory[slotIndex];
  if (!itemId) return;

  if (!state.useMode) {
    state.message = `This is your ${ITEMS[itemId].name}.`;
    return render();
  }

  state.useMode = false;
  if (state.location === "SP1" && itemId === "torch") {
    state.sp1TorchReady = true;
    state.message = "";
  } else if (state.location === "SP1") {
    state.sp1TorchReady = false;
    state.message = `You ready the ${ITEMS[itemId].name}, but the passage remains dangerously dark.`;
  } else if (state.location === "MONSTER" && itemId === "sword") {
    return navigateToLocation("MONSTER_DEATH");
  } else if (state.location === "MONSTER") {
    state.message = `The ${ITEMS[itemId].name} cannot stop the hungry monster.`;
  } else {
    state.message = `The ${ITEMS[itemId].name} won't work here.`;
  }
  render();
}

function clearInventory() {
  resetInventory();
  state.message = state.location === "CH1"
    ? "Your inventory is empty. You may search the chest and choose again."
    : "Your inventory is now empty.";
  render();
}

function setupInventoryControls() {
  document.getElementById("inventoryButton").onclick = toggleInventoryPanel;
  document.getElementById("useButton").onclick = beginUsingInventoryItem;
  document.querySelectorAll("[data-inventory-slot]").forEach(slot => {
    slot.onclick = () => selectInventoryItem(Number(slot.dataset.inventorySlot));
  });
  document.getElementById("clearInventoryButton").onclick = clearInventory;
}
