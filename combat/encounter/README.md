# Sword and shield combat demo

Open `index.html` directly from Finder, or visit `/combat/encounter/` on the local preview server. The generated page embeds scripts, styles and existing artwork, so it also works offline.

1. Roll and stop SKILL, STAMINA and LUCK using the existing stats generator.
2. Select START COMBAT DEMO. The demo assumes a sword is equipped, with maximum damage 5 HP. Sword pickup belongs in gameplay when this is integrated.
3. Start each turn, then press ATTACK or DEFEND to stop the sword.
4. Attack damage: red chest strip 5, brown chest 3, grey outer armour/timeout 0. Defence damage taken: centre 0, partial block 1, outer edges/timeout 3.
5. Roll New Character is available only while creating stats and disappears when all three are complete. There is no fight restart control. Reload the page to begin another demo run.

The test beast starts with **15 STAMINA** and maximum damage 3. These are adjustable defaults in `combat.js`. Both sides retain 1.5-second one-way traversal and the 10-second turn limit. Attack boundaries are aligned to the armour at 82% image height (19.5%, 43.7%, 53.8%, 78%); shield boundaries are unchanged. The original sword and shield artwork is reused, with ../attack-target.png as the attack target and the approved 126.75px attack sword width. No Game 2 integration is included.

SKILL and LUCK are retained in the current demo session but have no combat effect. Reloading creates a fresh character. Combat damage reduces current STAMINA only; it does not overwrite the original generated stats.

## Editing and reuse

Edit `index.template.html`, `encounter.css`, `encounter.js`, or the DOM-independent rules in `combat.js`. Then run from the repository root:

```
python3 combat/encounter/build-demo.py
node combat/encounter/test-combat.js
```

Commit `index.html` along with changed sources after rebuilding. `build-demo.py` embeds the existing dice and stats modules and sword/shield assets; do not edit the generated HTML directly.

`Combat.createEncounter({ playerStamina, enemy, weapon })` exposes `startTurn()`, `resolve(position, timedOut)`, `nextTurn()` and immutable `getState()` snapshots. Position is 0–1. `Combat.timing(elapsed)` supplies the shared movement and timeout calculation. `enemy` and `weapon` default to the exported test-beast and sword data.
