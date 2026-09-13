/* Reusable logic: Dice.rollDice() returns { values: [d1, d2], total }.
   Dice.createRoller({ onTick, onStop }) separates timing from the page UI.
   Call start() to begin/restart; stop() returns the final result and fires
   onStop(result) once. Later stat systems can consume that result directly. */
(function (root) {
  "use strict";

  function rollDice(random = Math.random) {
    const values = Array.from({ length: 2 }, () => {
      const sample = random();
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
        throw new RangeError("Random source must return a number in [0, 1).");
      }
      return Math.floor(sample * 6) + 1;
    });
    return Object.freeze({ values: Object.freeze(values), total: values[0] + values[1] });
  }

  function createRoller({ onTick = () => {}, onStop = () => {}, interval = 75, random = Math.random } = {}) {
    if (!Number.isFinite(interval) || interval <= 0) {
      throw new RangeError("Roll interval must be a positive number.");
    }
    let timer = null;
    let result = null;
    return {
      start() {
        if (timer !== null) return;
        result = null;
        timer = setInterval(() => onTick(rollDice(random)), interval);
        onTick(rollDice(random));
      },
      stop() {
        if (result !== null) return result;
        clearInterval(timer);
        timer = null;
        result = rollDice(random);
        onStop(result);
        return result;
      },
      destroy() {
        clearInterval(timer);
        timer = null;
      }
    };
  }

  // Optional player/enemy sequencing, independent of the DOM and animation.
  // recordRoll accepts a Dice result; onComplete receives both saved results.
  function createSequence({ onComplete = () => {} } = {}) {
    let player = null;
    let enemy = null;
    function getResults() {
      return Object.freeze({ player, enemy });
    }
    return {
      getResults,
      nextTurn() { return player === null ? "player" : enemy === null ? "enemy" : null; },
      recordRoll(result) {
        if (player !== null && enemy !== null) throw new Error("Reset before starting a new sequence.");
        if (!result || !Array.isArray(result.values) || result.values.length !== 2 ||
            !result.values.every(value => Number.isInteger(value) && value >= 1 && value <= 6) ||
            result.total !== result.values[0] + result.values[1]) {
          throw new TypeError("Expected a valid two-dice result.");
        }
        const saved = Object.freeze({ values: Object.freeze([...result.values]), total: result.total });
        if (player === null) player = saved;
        else {
          enemy = saved;
          onComplete(getResults());
        }
        return getResults();
      },
      reset() { player = null; enemy = null; }
    };
  }

  root.Dice = Object.freeze({ rollDice, createRoller, createSequence });
  if (typeof module !== "undefined" && module.exports) module.exports = root.Dice;
  if (typeof document === "undefined") return;

  function mount() {
    const dice = document.querySelectorAll(".die");
    const button = document.querySelector("#stop");
    const total = document.querySelector(".total strong");
    const pair = document.querySelector(".dice-pair");
    if (dice.length !== 2 || !button || !total || !pair) return;

    // Positions in a 3 x 3 grid, numbered left-to-right from 0 to 8.
    const faces = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
    dice.forEach(die => {
      for (let i = 0; i < 9; i++) {
        const pip = document.createElement("span");
        pip.className = "pip";
        pip.setAttribute("aria-hidden", "true");
        die.appendChild(pip);
      }
    });

    function render({ values }, final = false) {
      dice.forEach((die, index) => {
        Array.from(die.children).forEach((pip, position) => {
          pip.classList.toggle("visible", faces[values[index]].includes(position));
        });
        if (final) die.setAttribute("aria-label", `Die ${index + 1}: ${values[index]}`);
      });
    }

    const turnLabel = document.querySelector("#turn-label");
    const resultsPanel = document.querySelector(".results");
    const playerTotal = document.querySelector("#player-total");
    const enemyTotal = document.querySelector("#enemy-total");
    const hint = document.querySelector(".hint");
    const sequence = createSequence();
    let rolling = false;
    const roller = createRoller({
      onTick: render,
      onStop(result) {
        render(result, true);
        total.textContent = String(result.total);
        pair.setAttribute("aria-label", `Dice: ${result.values.join(" and ")}`);
        rolling = false;
        pair.classList.remove("rolling");
        const results = sequence.recordRoll(result);
        resultsPanel.hidden = false;
        playerTotal.textContent = String(results.player.total);
        enemyTotal.textContent = results.enemy ? String(results.enemy.total) : "—";
        button.textContent = results.enemy ? "ROLL AGAIN" : "ROLL ENEMY";
        hint.textContent = results.enemy
          ? "Press ROLL AGAIN to start a fresh sequence."
          : "Your total is saved. Press ROLL ENEMY.";
      }
    });
    function startRoll() {
      if (sequence.nextTurn() === null) {
        sequence.reset();
        resultsPanel.hidden = true;
        playerTotal.textContent = "—";
        enemyTotal.textContent = "—";
      }
      const turn = sequence.nextTurn();
      turnLabel.textContent = turn === "player" ? "YOUR ROLL" : "ENEMY ROLL";
      rolling = true;
      total.textContent = "—";
      button.textContent = "STOP";
      pair.classList.add("rolling");
      pair.setAttribute("aria-label", "Two dice rolling");
      dice.forEach((die, index) => die.setAttribute("aria-label", `Die ${index + 1} rolling`));
      hint.textContent = turn === "player"
        ? "Press STOP to reveal your roll."
        : "Press STOP to reveal the enemy’s roll.";
      roller.start();
    }
    button.addEventListener("click", () => {
      if (rolling) roller.stop();
      else startRoll();
    });
    window.addEventListener("pagehide", () => roller.destroy());
    window.addEventListener("pageshow", event => {
      if (event.persisted && rolling) roller.start();
    });
    startRoll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})(globalThis);
