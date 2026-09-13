'use strict';
const assert = require('node:assert/strict');
const Dice = require('../dice/dice.js');
const PlayerStats = require('./stats.js');
for (let first = 1; first <= 6; first++) {
  for (let second = 1; second <= 6; second++) {
    let sample = 0;
    const dice = { createRoller: options => Dice.createRoller({ ...options,
      random: () => ((sample++ % 2 ? second : first) - 0.5) / 6 }) };
    const generator = PlayerStats.createGenerator({ dice });
    assert.equal(generator.stop(), false);
    for (const stat of PlayerStats.definitions) {
      assert.equal(generator.getState().current.key, stat.key);
      assert.equal(generator.start(), true);
      assert.equal(generator.start(), false);
      assert.equal(generator.stop(), true);
      assert.equal(generator.stop(), false);
      const result = generator.getState().results[stat.key];
      assert.equal(result.total, first + (stat.dice === 2 ? second : 0) + stat.bonus);
      assert.equal(result.values.length, stat.dice);
      assert.ok(Object.isFrozen(result.values));
    }
    assert.equal(generator.getState().complete, true);
    assert.equal(generator.start(), false);
    const saved = generator.getState();
    generator.reset();
    assert.equal(generator.getState().current.key, 'skill');
    assert.deepEqual(generator.getState().results, {});
    assert.equal(saved.complete, true);
    generator.start();
    generator.reset();
    assert.equal(generator.stop(), false);
    generator.start(); generator.stop();
    assert.equal(generator.getState().current.key, 'stamina');
    generator.destroy();
    assert.equal(generator.start(), false);
  }
}
console.log('Passed: all 36 dice pairs, stat calculations, order, repeated controls, completion, reset during roll, immutable results, and disposal.');
