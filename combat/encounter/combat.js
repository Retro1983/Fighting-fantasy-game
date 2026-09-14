/* DOM-independent combat rules. Character creation and timing remain separate. */
(function (root) {
  'use strict';
  const sword = Object.freeze({ name: 'Sword', maxDamage: 5, partialDamage: 3 });
  const beast = Object.freeze({ name: 'Beast', stamina: 15, maxDamage: 3, partialDamage: 1 });
  function zone(position, turn = "defence") {
    if (!Number.isFinite(position) || position < 0 || position > 1) throw new RangeError('Position must be between 0 and 1.');
    // Attack boundaries follow the armour at 82% image height; shield zones stay unchanged.
    if (turn === 'attack') return position < .195 || position >= .78 ? 'red' : position < .437 || position >= .538 ? 'yellow' : 'green';
    return position < .175 || position >= .825 ? 'red' : position < .4 || position >= .6 ? 'yellow' : 'green';
  }
  function timing(elapsed, travelTime = 1500) {
    const journey = (Math.max(0, elapsed) % (travelTime * 2)) / travelTime;
    return Object.freeze({ position: journey <= 1 ? journey : 2 - journey, remaining: Math.max(0, 10000 - elapsed) });
  }
  function createEncounter({ playerStamina, enemy = beast, weapon = sword } = {}) {
    for (const value of [playerStamina, enemy.stamina]) {
      if (!Number.isInteger(value) || value <= 0) throw new RangeError('Starting STAMINA must be a positive integer.');
    }
    for (const value of [enemy.maxDamage, enemy.partialDamage, weapon.maxDamage, weapon.partialDamage]) {
      if (!Number.isInteger(value) || value < 0) throw new RangeError('Damage must be a nonnegative integer.');
    }
    let player = playerStamina, opponent = enemy.stamina, turn = 'attack', phase = 'ready', outcome = null, last = null;
    function getState() { return Object.freeze({ player, opponent, turn, phase, outcome, last }); }
    return Object.freeze({
      getState,
      startTurn() {
        if (phase !== 'ready') return false;
        phase = 'rolling'; return true;
      },
      resolve(position, timedOut = false) {
        if (phase !== 'rolling') return getState();
        const hitZone = timedOut ? 'red' : zone(position, turn);
        const attack = turn === 'attack';
        const damage = attack
          ? hitZone === 'green' ? weapon.maxDamage : hitZone === 'yellow' ? weapon.partialDamage : 0
          : hitZone === 'green' ? 0 : hitZone === 'yellow' ? enemy.partialDamage : enemy.maxDamage;
        const label = timedOut ? (attack ? 'TIME OUT — MISS' : 'TIME OUT — HIT')
          : attack ? ({green:'CRITICAL HIT',yellow:'PARTIAL BLOW',red:'MISS'})[hitZone]
          : ({green:'PERFECT BLOCK',yellow:'PARTIAL BLOCK',red:'HIT'})[hitZone];
        if (attack) opponent = Math.max(0, opponent - damage);
        else player = Math.max(0, player - damage);
        last = Object.freeze({ turn, zone: hitZone, damage, label, timedOut });
        outcome = opponent === 0 ? 'victory' : player === 0 ? 'defeat' : null;
        phase = outcome ? 'complete' : 'result';
        return getState();
      },
      nextTurn() {
        if (phase !== 'result') return false;
        turn = turn === 'attack' ? 'defence' : 'attack'; phase = 'ready'; return true;
      }
    });
  }
  root.Combat = Object.freeze({ sword, beast, zone, timing, createEncounter });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Combat;
})(globalThis);
