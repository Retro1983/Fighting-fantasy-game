'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const Dice = require(path.join(root, 'dice/dice.js'));
const PlayerStats = require(path.join(root, 'stats/stats.js'));
function character(luck, first, second) {
  let n = 0;
  return PlayerStats.createCharacter({ results: { skill: { total: 10 }, stamina: { total: 20 }, luck: { total: luck } },
    dice: { rollDice: () => Dice.rollDice(() => ((n++ % 2 ? second : first) - .5) / 6) } });
}
for (let luck = 0; luck <= 12; luck++) {
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const player = character(luck, a, b);
    const before = player.getState();
    const result = player.testLuck();
    assert.equal(result.successful, a + b <= luck);
    assert.equal(result.total, a + b);
    assert.equal(result.luckUsed, luck);
    assert.equal(result.luckAfter, Math.max(0, luck - 1));
    assert.equal(before.current.luck, luck);
    assert.equal(player.getState().initial.luck, luck);
    player.testLuck();
    assert.equal(player.getState().current.luck, Math.max(0, luck - 2));
  }
}
// Exercise the actual browser scripts and rendered text with a minimal DOM.
const elements = new Map();
function element() { return { hidden: false, textContent: '', children: [], firstElementChild: { focus() {} }, classList: { toggle() {} }, setAttribute() {}, replaceChildren(...children) { this.children = children; } }; }
const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  querySelector() { return element(); }, querySelectorAll() { return []; }, createElement: element };
let sample = 0;
const controlledDice = { ...Dice, createRoller: options => Dice.createRoller({ ...options,
  random: () => ((sample++ % 2 ? 4 : 3) - .5) / 6 }) };
const context = vm.createContext({ PlayerStats, Dice: controlledDice, document, setInterval, clearInterval,
  PlayerStatsUI: { renderDice() {} },
  setupCharacterCreation() {}, characterSetup: { reset() {} } });
for (const file of ['map-data.js', 'navigation/navigation.js', 'inventory/inventory.js', 'combat/combat.js', 'luck-check.js', 'game.js']) {
  if (file === 'game.js') vm.runInContext('setupLuckCheck = () => {};', context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
}
assert.equal(elements.get('adventure').hidden, true);
assert.equal(elements.get('characterSetup').hidden, false);
context.makeCharacter = character;
const run = code => vm.runInContext(code, context);
run('state.player = makeCharacter(7, 3, 4); navigateToLocation("P1"); state.inventory = ["torch"];');
assert.match(elements.get('luckResult').textContent, /Current LUCK: 7/);
const staleJump = elements.get('choiceButtons').children[0];
staleJump.onclick();
assert.equal(run('state.location'), 'P1');
assert.equal(run('state.player.getState().current.luck'), 7);
assert.match(elements.get('luckResult').textContent, /Press STOP/);
staleJump.onclick();
run('stopLuckCheck(); stopLuckCheck();');
assert.equal(run('state.location'), 'PIT_DOOR');
assert.equal(elements.get('storyText').textContent, 'You made the jump and enter the door');
assert.equal(elements.get('scene').src, 'assets/door-slightly-ajar.png');
assert.equal(elements.get('choiceButtons').children.length, 1);
assert.match(elements.get('luckResult').textContent, /3 \+ 4 = 7. LUCK used: 7. Successful. New LUCK: 6/);
assert.equal(run('state.inventory[0]'), 'torch');
staleJump.onclick();
assert.equal(run('state.player.getState().current.luck'), 6);
elements.get('choiceButtons').children[0].onclick();
assert.equal(run('state.location'), 'M1');
assert.equal(run('state.player.getState().current.luck'), 6);
run('navigateToLocation("P1"); choose(LOCATIONS.P1.choices[0]); stopLuckCheck();');
assert.equal(run('state.location'), 'DEATH');
assert.equal(elements.get('scene').src, 'assets/death.png');
assert.equal(elements.get('storyText').textContent, run('LOCATIONS.DEATH.text'));
assert.match(elements.get('luckResult').textContent, /LUCK used: 6. Unsuccessful. New LUCK: 5/);
run('choose(LOCATIONS.DEATH.choices[0]);');
assert.equal(run('state.location'), 'RA1');
assert.equal(run('state.inventory.length'), 0);
assert.equal(run('state.luckResult'), null);
assert.equal(run('state.player'), null);
assert.equal(elements.get('adventure').hidden, true);
assert.equal(elements.get('characterSetup').hidden, false);
run('state.player = makeCharacter(0, 1, 1); navigateToLocation("P1"); choose(LOCATIONS.P1.choices[0]); stopLuckCheck();');
assert.equal(run('state.location'), 'DEATH');
assert.equal(run('state.player.getState().current.luck'), 0);
console.log('Passed: 468 Luck combinations, repeated costs, equality, zero floor, immutable snapshots, actual navigation/rendering, death artwork/text, stale clicks, inventory preservation, and restart.');

const supplied = character(7, 6, 6);
assert.equal(supplied.testLuck({ values: [3, 4], total: 7 }).successful, true, 'Use the stopped dice without rerolling');
assert.throws(() => supplied.testLuck({ values: [0, 7], total: 7 }), TypeError);
assert.equal(supplied.getState().current.luck, 6);
run('state.player = makeCharacter(7, 3, 4); navigateToLocation("P1"); choose(LOCATIONS.P1.choices[0]); navigateToLocation("M1"); stopLuckCheck();');
assert.equal(run('state.player.getState().current.luck'), 7, 'Cancelled roll does not spend Luck');
assert.equal(run('pendingLuck'), null);
