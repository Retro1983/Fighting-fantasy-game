/*
 * Location IDs and artwork IDs remain separate. The player sees story choices,
 * while the map IDs quietly keep every part of the dungeon distinct.
 * Story consequences are represented as their own locations so navigation and
 * artwork stay easy to follow.
 */
const ARTWORK = Object.freeze({
  RA: { file: "assets/room.png", label: "Standard room" },
  RB: { file: "assets/Room_two_doors.png", label: "Room with two doors" },
  M: { file: "assets/corridor_mid.png", label: "Middle corridor" },
  DA: { file: "assets/cell_door.png", label: "Cell door" },
  SP: { file: "assets/spikes.png", label: "Spikes corridor" },
  TRIP_WIRE: { file: "assets/trip_wire.png", label: "Revealed trip wire" },
  P: { file: "assets/Pit.png", label: "Pit corridor" },
  EW: { file: "assets/east_west.png", label: "East/west turn" },
  CH: { file: "assets/chest_room.png", label: "Chest room" },
  MONSTER: { file: "assets/monster.png", label: "Monster area" },
  MONSTER_DEATH: { file: "assets/monster_death.png", label: "Defeated monster" },
  GOLD_COINS: { file: "assets/gold_coins.png", label: "Gold coins" },
  FREEDOM: { file: "assets/freedom.webp", label: "Freedom" },
  DEATH: { file: "assets/death.png", label: "Death at the pit" },
  DEATH2: { file: "assets/death_2.png", label: "Death at the trip wire" },
  DEATH3: { file: "assets/death_3.png", label: "Death at the monster" }
});

const ITEMS = Object.freeze({
  torch: Object.freeze({ name: "Glowing Torch" }),
  sword: Object.freeze({ name: "Sword" }),
  gold: Object.freeze({ name: "Bag of Gold Coins" })
});

const LOCATIONS = Object.freeze({
  RA1: {
    artId: "RA", title: "The First Room",
    text: "You stand in a stone room. A passage leads away into the dungeon. Your mission is to find the gold. Be sure to use all available options below.",
    choices: [{ label: "Enter the passage", target: "M4" }]
  },
  M4: {
    artId: "M", title: "The Passage",
    text: "The narrow passage ends at a heavy cell door.",
    choices: [
      { label: "Approach the door", target: "DA1" },
      { label: "Return to the room", target: "RA1" }
    ]
  },
  DA1: {
    artId: "DA", title: "The Cell Door",
    text: "A heavy door stands between you and the chamber beyond.",
    choices: [
      { label: "Go through the door", target: "RB1" },
      { label: "Return along the passage", target: "M4" }
    ]
  },
  RB1: {
    artId: "RB", title: "The Two Doors",
    text: "You have entered a corridor. There is a door to the left and one to the right. Which one would you like to take?",
    choices: [
      { label: "Take the left door", target: "M1" },
      { label: "Take the right door", target: "EW1" },
      { label: "Return the way you came", target: "DA1" }
    ]
  },
  M1: {
    artId: "M", title: "The Left Passage",
    text: "The left-hand passage continues towards a dark opening in the floor.",
    choices: [
      { label: "Continue towards the opening", target: "P1" },
      { label: "Return to the two doors", target: "RB1" }
    ]
  },
  P1: {
    artId: "P", title: "The Pit",
    text: "There is a large pit in front of you, with a door visible beyond it.",
    choices: [
      { label: "Attempt to jump the pit", target: "DEATH" },
      { label: "Return the way you came", target: "M1" }
    ]
  },
  DEATH: {
    artId: "DEATH", title: "Death",
    text: "You leap towards the far side, but the pit is too wide. Your fingers scrape against the broken stone as you fall into the darkness below.",
    ending: true,
    choices: [{ label: "Restart Adventure", target: "RA1", restart: true }]
  },
  M2: {
    artId: "M", title: "The Western Passage",
    text: "The western passage leads towards the left-hand corridor.",
    choices: [
      { label: "Continue into the left-hand corridor", target: "M1" },
      { label: "Return to the east-west junction", target: "EW1" }
    ]
  },
  EW1: {
    artId: "EW", title: "The East-West Passage",
    text: "The passage divides. One route turns left and the other turns right towards a chamber.",
    choices: [
      { label: "Take the left route", target: "M2" },
      { label: "Take the right route", target: "CH1" },
      { label: "Return to the two doors", target: "RB1" }
    ]
  },
  CH1: {
    artId: "CH", title: "The Chest Room",
    text: "A chest rests in the chamber. Another corridor leads away from the room.",
    choices: [
      { label: "Enter the next corridor", target: "M3" },
      { label: "Search the chest", action: "searchChest" },
      { label: "Return to the east-west passage", target: "EW1" }
    ]
  },
  M3: {
    artId: "M", title: "The Southern Passage",
    text: "The corridor stretches onwards through the darkness.",
    choices: [
      { label: "Continue along the corridor", target: "SP1" },
      { label: "Return to the chest room", target: "CH1" }
    ]
  },
  SP1: {
    artId: "SP", title: "The Dark Passage",
    text: "The passage is getting extremely dark.",
    torchArtId: "TRIP_WIRE",
    torchText: "You see a trip wire and safely continue on your adventure.",
    choices: [
      { label: "Continue forward", action: "continueSP1", target: "DEATH2", successTarget: "DA3" },
      { label: "Turn back", target: "M3" }
    ]
  },
  DEATH2: {
    artId: "DEATH2", title: "Death",
    text: "You snag a trip wire and are impaled.",
    ending: true,
    choices: [{ label: "Restart Adventure", target: "RA1", restart: true }]
  },
  DA3: {
    artId: "DA", title: "The Second Door",
    text: "A cell door leads into another room.",
    choices: [
      { label: "Enter the room", target: "RA2" },
      { label: "Return to the spiked passage", target: "SP1" }
    ]
  },
  RA2: {
    artId: "RA", title: "The Second Room",
    text: "A passage leaves the room to your right.",
    choices: [
      { label: "Follow the passage", target: "M5" },
      { label: "Return through the door", target: "DA3" }
    ]
  },
  M5: {
    artId: "M", title: "The Eastern Passage",
    text: "The passage continues towards a dark chamber. Something is waiting ahead.",
    choices: [
      { label: "Continue into the dark chamber", target: "MONSTER" },
      { label: "Return to the previous room", target: "RA2" }
    ]
  },
  MONSTER: {
    artId: "MONSTER", title: "The Monster",
    text: "A monster stands before you, and it looks hungry!!!",
    timeLimit: 10,
    timeoutTarget: "DEATH3",
    choices: [{ label: "Try to escape", target: "DEATH3", successTarget: "MONSTER_DEATH" }]
  },
  MONSTER_DEATH: {
    artId: "MONSTER_DEATH", title: "The Monster Is Defeated",
    text: "Your sword strikes true. The monster falls, leaving the way to the next room clear.",
    choices: [{ label: "Continue to the next room", target: "RA4" }]
  },
  DEATH3: {
    artId: "DEATH3", title: "Death",
    text: "You were not quick enough to escape.",
    ending: true,
    choices: [{ label: "Restart Adventure", target: "RA1", restart: true }]
  },
  RA4: {
    artId: "RA", title: "The Fourth Room",
    text: "You enter the room beyond the monster's chamber.",
    examineTarget: "GOLD_COINS",
    choices: [
      { label: "Step out into freedom", target: "FREEDOM" },
      { label: "Return to the monster's chamber", target: "MONSTER_DEATH" }
    ]
  },
  GOLD_COINS: {
    artId: "GOLD_COINS", title: "A Hidden Fortune",
    text: "Your search reveals a bag spilling over with gold coins.",
    choices: [{ label: "Continue to freedom", target: "FREEDOM" }]
  },
  FREEDOM: {
    artId: "FREEDOM", title: "Freedom",
    text: "You emerge from the dungeon at last. Your journey through these passages is complete.",
    ending: true,
    choices: []
  }
});

const START = "RA1";

if (typeof module !== "undefined") module.exports = { ARTWORK, ITEMS, LOCATIONS, START };
