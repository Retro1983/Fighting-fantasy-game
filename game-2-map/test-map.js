const assert = require("node:assert/strict");
const { ARTWORK, ITEMS, LOCATIONS, START } = require("./map-data.js");

assert.ok(LOCATIONS[START], "Start location must exist");
assert.equal(
  LOCATIONS.RA1.text,
  "You stand in a stone room. A passage leads away into the dungeon. Your mission is to find the gold. Be sure to use all available options below.",
  "RA1 must explain the mission"
);

for (const [id, location] of Object.entries(LOCATIONS)) {
  assert.ok(ARTWORK[location.artId], `${id} uses missing artwork ${location.artId}`);
  assert.ok(location.title, `${id} needs a player-facing title`);
  assert.ok(location.text, `${id} needs story text`);
  if (location.examineTarget) {
    assert.ok(LOCATIONS[location.examineTarget], `${id} examines to missing location ${location.examineTarget}`);
  }
  if (location.timeLimit) {
    assert.ok(Number.isInteger(location.timeLimit) && location.timeLimit > 0, `${id} needs a positive whole-second time limit`);
    assert.ok(LOCATIONS[location.timeoutTarget], `${id} times out to missing location ${location.timeoutTarget}`);
  }
  if (location.ending) {
    assert.ok(location.choices.length <= 1, `${id} ending may only offer a restart`);
    if (location.choices.length === 1) {
      assert.equal(location.choices[0].restart, true, `${id} ending choice must be a restart`);
      assert.equal(location.choices[0].target, START, `${id} restart must return to the start`);
    }
  } else {
    assert.ok(location.choices.length >= 1 && location.choices.length <= 4, `${id} must offer 1-4 choices`);
  }
  for (const choice of location.choices) {
    assert.ok(choice.label, `${id} has an unlabelled choice`);
    assert.ok(choice.target || choice.action, `${id} choice needs a target or action`);
    if (choice.target) assert.ok(LOCATIONS[choice.target], `${id} points to missing location ${choice.target}`);
    if (choice.successTarget) assert.ok(LOCATIONS[choice.successTarget], `${id} points to missing success location ${choice.successTarget}`);
  }
}

const visited = new Set([START]);
const queue = [START];
while (queue.length) {
  const id = queue.shift();
  const examineTarget = LOCATIONS[id].examineTarget;
  if (examineTarget && !visited.has(examineTarget)) {
    visited.add(examineTarget);
    queue.push(examineTarget);
  }
  for (const choice of LOCATIONS[id].choices.filter(choice => choice.target)) {
    if (!visited.has(choice.target)) { visited.add(choice.target); queue.push(choice.target); }
    if (choice.successTarget && !visited.has(choice.successTarget)) {
      visited.add(choice.successTarget);
      queue.push(choice.successTarget);
    }
  }
}
assert.equal(visited.size, Object.keys(LOCATIONS).length, "Every playable location must be reachable");
assert.deepEqual(
  LOCATIONS.RB1.choices.map(choice => choice.target),
  ["M1", "EW1", "DA1"],
  "RB1 must offer left, right, and return in that order"
);
assert.deepEqual(
  LOCATIONS.EW1.choices.map(choice => choice.target),
  ["M2", "CH1", "RB1"],
  "EW1 must offer left, right, and return in that order"
);
assert.equal(LOCATIONS.DA3.choices[0].target, "RA2", "DA3 must lead to RA2");
assert.equal(LOCATIONS.RA2.choices[0].target, "M5", "RA2 must lead to M5");
assert.equal(LOCATIONS.M5.choices[0].target, "MONSTER", "M5 must lead to MONSTER");
assert.equal(
  LOCATIONS.MONSTER.text,
  "A monster stands before you, and it looks hungry!!!",
  "MONSTER must show the hungry monster text"
);
assert.equal(LOCATIONS.MONSTER.choices[0].target, "DEATH3", "Escaping MONSTER without the sword must lead to DEATH3");
assert.equal(LOCATIONS.MONSTER.choices[0].successTarget, "MONSTER_DEATH", "Using the Sword at MONSTER must reach MONSTER_DEATH");
assert.equal(LOCATIONS.MONSTER.timeLimit, 10, "MONSTER must have a 10-second timer");
assert.equal(LOCATIONS.MONSTER.timeoutTarget, "DEATH3", "MONSTER timer must end at DEATH3");
assert.equal(LOCATIONS.MONSTER_DEATH.choices[0].target, "RA4", "A defeated monster must lead to RA4");
assert.equal(LOCATIONS.RA4.choices[0].target, "FREEDOM", "RA4 must lead to FREEDOM");
assert.equal(LOCATIONS.RA4.choices[1].target, "MONSTER_DEATH", "RA4 must return to the defeated monster scene");
assert.equal(LOCATIONS.RA4.examineTarget, "GOLD_COINS", "Examining RA4 must reveal GOLD_COINS");
assert.equal(LOCATIONS.GOLD_COINS.choices[0].target, "FREEDOM", "GOLD_COINS must continue to FREEDOM");
assert.equal(LOCATIONS.FREEDOM.ending, true, "FREEDOM must be an ending");
assert.deepEqual(
  LOCATIONS.P1.choices.map(choice => choice.target),
  ["DEATH", "M1"],
  "P1 must offer jump to DEATH or return to M1"
);
assert.equal(LOCATIONS.DEATH.ending, true, "DEATH must be an ending");
assert.deepEqual(
  LOCATIONS.DEATH.choices[0],
  { label: "Restart Adventure", target: "RA1", restart: true },
  "DEATH must offer Restart Adventure"
);
assert.deepEqual(
  LOCATIONS.CH1.choices.map(choice => choice.target || choice.action),
  ["M3", "searchChest", "EW1"],
  "CH1 must offer corridor, chest, and return in that order"
);
assert.deepEqual(
  Object.values(ITEMS).map(item => item.name),
  ["Glowing Torch", "Sword", "Bag of Gold Coins"],
  "The chest must contain the three defined items"
);
assert.deepEqual(
  LOCATIONS.SP1.choices.map(choice => choice.target),
  ["DEATH2", "M3"],
  "SP1 must continue to DEATH2 or turn back to M3"
);
assert.equal(LOCATIONS.SP1.choices[0].action, "continueSP1", "SP1 forward choice must check the used item");
assert.equal(LOCATIONS.SP1.choices[0].successTarget, "DA3", "The torch route must advance to DA3");
assert.equal(LOCATIONS.SP1.torchArtId, "TRIP_WIRE", "Using the torch at SP1 must reveal the trip-wire artwork");
assert.equal(
  LOCATIONS.SP1.torchText,
  "You see a trip wire and safely continue on your adventure.",
  "SP1 must replace its text after the torch is used"
);
assert.equal(LOCATIONS.DEATH2.ending, true, "DEATH2 must be an ending");
assert.equal(LOCATIONS.DEATH2.choices[0].restart, true, "DEATH2 must offer Restart Adventure");
assert.equal(LOCATIONS.DEATH3.text, "You were not quick enough to escape.", "DEATH3 must show the monster death text");
assert.equal(LOCATIONS.DEATH3.ending, true, "DEATH3 must be an ending");
assert.equal(LOCATIONS.DEATH3.choices[0].restart, true, "DEATH3 must offer Restart Adventure");

console.log(`Story map valid: ${visited.size} playable locations, ${Object.keys(ARTWORK).length} artwork groups.`);
