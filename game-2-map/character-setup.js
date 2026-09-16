let characterSetup = null;
function setupCharacterCreation() {
  const host = document.getElementById('characterSetup');
  const view = host.attachShadow({ mode: 'open' });
  view.innerHTML = `<link rel="stylesheet" href="../dice/dice.css">
    <link rel="stylesheet" href="../stats/stats.css">
    <style>:host { display: block; min-height: 100vh; background: #100f0d; color: #e6d8b7; font-family: Georgia, serif; }
    main { margin: auto; } #begin-adventure { margin-top: 16px; }</style>
  <main class="dice-panel">
    <p class="eyebrow">YOUR ADVENTURE BEGINS</p>
    <h1>Create your character.</h1>
    <p id="step" class="turn-label"></p>
    <p id="rule" class="hint"></p>
    <div id="stat-dice" class="dice-pair" role="img" aria-label="Dice ready to roll"></div>
    <p id="message" role="status" aria-live="polite" aria-atomic="true"></p>
    <button id="roll-stat" type="button">ROLL SKILL</button>
    <section aria-labelledby="summary-title">
      <h2 id="summary-title">Your character so far</h2>
      <dl id="summary"></dl>
    </section>
    <button id="reset-stats" class="secondary" type="button">START OVER</button>
    <button id="begin-adventure" type="button" hidden>BEGIN ADVENTURE</button>
    <p class="footnote">Skill. Stamina. Luck. Your story awaits.</p>
  </main>`;
  characterSetup = PlayerStatsUI.mount(view, { onComplete(results) {
    if (state.player) return;
    state.player = PlayerStats.createCharacter({ results });
    render();
    document.getElementById('locationName').focus();
  } });
}
