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
  root.PlayerStats = Object.freeze({ definitions, createGenerator });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PlayerStats;
})(globalThis);
