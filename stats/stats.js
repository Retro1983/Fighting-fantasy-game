/* DOM-independent character generation. Load dice/dice.js before this file. */
(function (root) {
  'use strict';
  const definitions = Object.freeze([
    Object.freeze({ key: 'skill', label: 'SKILL', dice: 1, bonus: 6 }),
    Object.freeze({ key: 'stamina', label: 'STAMINA', dice: 2, bonus: 12 }),
    Object.freeze({ key: 'luck', label: 'LUCK', dice: 1, bonus: 6 })
  ]);
  function createGenerator({ dice = root.Dice, onChange = () => {}, onTick = () => {} } = {}) {
    if (!dice || typeof dice.createRoller !== 'function') throw new TypeError('Dice.createRoller is required.');
    let results = {};
    let index = 0;
    let rolling = false;
    let disposed = false;
    function getState() {
      return Object.freeze({ current: definitions[index] || null, rolling,
        complete: index === definitions.length, results: Object.freeze({ ...results }) });
    }
    function selectedValues(result) {
      const values = result.values.slice(0, definitions[index].dice);
      if (values.length !== definitions[index].dice || !values.every(v => Number.isInteger(v) && v >= 1 && v <= 6)) {
        throw new TypeError('Expected six-sided dice values.');
      }
      return Object.freeze(values);
    }
    const roller = dice.createRoller({
      onTick(result) { if (rolling && !disposed) onTick(selectedValues(result), getState()); },
      onStop(result) {
        if (!rolling || disposed) return;
        const stat = definitions[index];
        const values = selectedValues(result);
        const total = values.reduce((sum, value) => sum + value, 0) + stat.bonus;
        results[stat.key] = Object.freeze({ values, bonus: stat.bonus, total,
          calculation: `Roll ${values.join(' + ')} + ${stat.bonus} = ${stat.label} ${total}` });
        rolling = false;
        index += 1;
        onChange(getState());
      }
    });
    return Object.freeze({
      getState,
      start() {
        if (disposed || rolling || index === definitions.length) return false;
        rolling = true;
        onChange(getState());
        roller.start();
        return true;
      },
      stop() {
        if (disposed || !rolling) return false;
        roller.stop();
        return true;
      },
      reset() {
        if (disposed) return;
        roller.destroy();
        results = {}; index = 0; rolling = false;
        onChange(getState());
      },
      destroy() { roller.destroy(); rolling = false; disposed = true; }
    });
  }
  // A fresh adventure uses the existing generator and owns its current stats.
  // Passing completed generator results also supports games with manual setup.
  function createCharacter({ results, dice = root.Dice } = {}) {
    if (!results) {
      const generator = createGenerator({ dice });
      try {
        for (const stat of definitions) { generator.start(); generator.stop(); }
        results = generator.getState().results;
      } finally { generator.destroy(); }
    }
    const initial = {};
    for (const { key } of definitions) {
      const value = results[key]?.total;
      if (!Number.isInteger(value) || value < 0) throw new TypeError('Expected completed stat results.');
      initial[key] = value;
    }
    Object.freeze(initial);
    const current = { ...initial };
    return Object.freeze({
      getState() { return Object.freeze({ initial, current: Object.freeze({ ...current }) }); },
      testLuck(roll = dice.rollDice()) {
        if (!roll || !Array.isArray(roll.values) || roll.values.length !== 2 ||
            !roll.values.every(value => Number.isInteger(value) && value >= 1 && value <= 6) ||
            roll.total !== roll.values[0] + roll.values[1]) throw new TypeError('Expected a valid two-dice result.');
        const luckUsed = current.luck;
        current.luck = Math.max(0, luckUsed - 1);
        return Object.freeze({ values: Object.freeze([...roll.values]), total: roll.total, luckUsed,
          successful: roll.total <= luckUsed, luckAfter: current.luck });
      }
    });
  }
  root.PlayerStats = Object.freeze({ definitions, createGenerator, createCharacter });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PlayerStats;
})(globalThis);
