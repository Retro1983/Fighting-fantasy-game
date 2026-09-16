# Reusable player stats

Double-click `stats/index.html` in Finder, or serve the repository and visit `/stats/`. The committed demo embeds its CSS and JavaScript and needs no server or build step to play.

For edits, change `index.template.html`, `stats.css`, `stats.js`, `stats-demo.js`, or the shared dice sources, then run `python3 stats/build-demo.py` from the repository root. Commit the regenerated `stats/index.html` alongside the changed sources. The separate JS modules remain reusable by other games. This prototype is not connected to Game 2.

Roll and stop SKILL, then STAMINA, then LUCK. Start Over discards all three results, including any roll in progress.

## Use in a future game

Load `../dice/dice.js`, then `stats.js`. The demo controller and CSS are optional.

```js
const character = PlayerStats.createGenerator({
  onTick(values, state) { /* Display the current dice values. */ },
  onChange(state) {
    if (state.complete) {
      const { skill, stamina, luck } = state.results;
      // Save skill.total, stamina.total and luck.total in your game.
    }
  }
});
character.start(); // Begins the next stat roll.
character.stop();  // Saves its result and advances to the next stat.
character.getState();
character.reset(); // Cancels an active roll and clears all results.
character.destroy(); // Cancels timers and permanently disposes this generator.
```

`PlayerStats.definitions` lists the ordered rules. State and result snapshots are frozen; each saved stat exposes `values`, `bonus`, `total`, and `calculation`. Repeated starts/stops and rolling after completion are ignored. No storage, combat, or current/max-stat management is included.

The unchanged Dice.createRoller supplies animation timing and random rolls. It generates two dice per tick/stop; this adapter selects only the first for SKILL and LUCK, and both for STAMINA. The unused second die never contributes to single-die stats. The demo reuses dice/dice.css; its DOM does not match the dice module's auto-mount controls.

Run `node stats/test-stats.js` from the repository root to test the generator against the real dice module with all 36 ordered dice pairs.
