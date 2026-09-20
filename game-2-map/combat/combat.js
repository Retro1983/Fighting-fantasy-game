// Game-specific routing and character persistence; all battle rules live in Combat.
// Results belong to this character and encounter, never to global combat defaults.
const skillTests = new WeakMap();
let skillRoller = null;
let activeBattle = null;
let battleLocation = null;
function stopBattle() {
  if (skillRoller) skillRoller.destroy();
  skillRoller = null;
  if (activeBattle) activeBattle.destroy();
  activeBattle = null;
  battleLocation = null;
  document.getElementById('battle').hidden = true;
}
function syncBattle() {
  const config = LOCATIONS[state.location].encounter;
  if (!state.player || !config) { stopBattle(); return; }
  if (battleLocation === state.location) return;
  stopBattle();
  const player = state.player;
  if (player.getState().current.stamina === 0) return navigateToLocation(config.defeat);
  battleLocation = state.location;
  document.getElementById('battle').hidden = false;
  let tests = skillTests.get(player);
  if (!tests) { tests = new Map(); skillTests.set(player, tests); }
  const location = state.location;
  function beginBattle() {
    if (battleLocation !== location || state.player !== player || activeBattle) return;
    const test = tests.get(location);
    if (!test) return;
    activeBattle = BattleUI.mount(document.getElementById('battle'), {
    attackTravelTime: test.passed ? 1800 : 800,
    defenceTravelTime: test.passed ? 1800 : 800,
    feedbackTarget: document.getElementById('scene'),
    player: player.getState().current,
    enemy: { ...Combat.beast, ...config.enemy },
    onDamage(amount) { player.takeDamage(amount); renderPlayerStats(); },
    onComplete(outcome) { navigateToLocation(config[outcome === 'victory' ? 'victory' : 'defeat']); }
    });
    const compactStyle = document.createElement('style');
    compactStyle.textContent = `
      main { display:grid; grid-template-columns:1fr auto; gap:4px 10px; text-align:center; }
      p, h2 { margin:0; } p { line-height:1.35; } h2 { font-size:20px; text-align:left; }
      #stats, .scores, .arena, #rules, #result, #action { grid-column:1 / -1; }
      #stats, .scores p:first-child { display:none; } .scores { gap:16px; }
      .scores p { font-size:14px; } .scores strong { display:inline; font-size:20px; }
      #clock { font-size:16px; align-self:center; }
      #attack-area, #defence-area { width:min(52%, 16dvh); max-width:180px; margin:3px auto; }
      #attack-sword { width:55px; } #defence-sword { height:80px; }
      #rules { font-size:14px; line-height:1.3; }
      #result { min-height:24px; font-size:17px; line-height:1.3; }
      #action { min-height:44px; margin:0; font-size:16px; }
    `;
    document.getElementById('battle').shadowRoot.appendChild(compactStyle);
  }
  const host = document.getElementById('battle');
  const view = host.shadowRoot || host.attachShadow({ mode: 'open' });
  view.innerHTML = `<link rel="stylesheet" href="../dice/dice.css">
    <style>:host { display:block; flex-shrink:0; } h2 { font-size:24px; margin:0 0 8px; }
    .dice-pair { margin:6px 0; padding:8px 0; gap:28px; }
    .die { width:64px; padding:10px; gap:5px; } [hidden] { display:none!important; }
    button { letter-spacing:.08em; } p { line-height:1.35; margin:8px 0; } button { min-height:44px; }</style>
    <h2>TEST YOUR SKILL</h2><p id="skill-value"></p>
    <div id="skill-dice" class="dice-pair" role="img" aria-label="Two dice ready"></div>
    <p id="skill-result" role="status" aria-live="polite"></p>
    <p id="skill-story"></p><button id="skill-action" type="button">ROLL DICE</button>`;
  const $ = id => view.getElementById(id);
  const skill = player.getState().current.skill;
  $('skill-value').textContent = `SKILL: ${skill}`;
  function showResult(test) {
    PlayerStatsUI.renderDice($('skill-dice'), test.values);
    $('skill-value').textContent = `SKILL: ${test.skill}`;
    $('skill-result').textContent = `ROLL: ${test.total} (${test.values.join(' + ')}) — SKILL TEST ${test.passed ? 'PASSED' : 'FAILED'}`;
    $('skill-story').textContent = test.passed
      ? "You quickly spot weaknesses in the creature's stance. This enemy is less dangerous than it first appeared."
      : "The monster is an experienced fighter. It reads your movements easily and prepares to attack.";
    $('skill-action').textContent = 'BEGIN BATTLE';
    $('skill-action').onclick = beginBattle;
  }
  const saved = tests.get(location);
  if (saved) { showResult(saved); return; }
  PlayerStatsUI.renderDice($('skill-dice'), [1, 1]);
  $('skill-result').textContent = 'Roll two dice. Equal to or below your SKILL passes.';
  let rolling = false;
  $('skill-action').onclick = () => {
    if (battleLocation !== location || state.player !== player || tests.has(location)) return;
    if (rolling) { skillRoller.stop(); return; }
    rolling = true;
    skillRoller = Dice.createRoller({
      onTick(roll) { PlayerStatsUI.renderDice($('skill-dice'), roll.values, true); },
      onStop(roll) {
        if (battleLocation !== location || tests.has(location)) return;
        const test = Object.freeze({ skill, values: roll.values, total: roll.total, passed: roll.total <= skill });
        tests.set(location, test);
        skillRoller.destroy(); skillRoller = null;
        showResult(test);
      }
    });
    $('skill-action').textContent = 'STOP';
    $('skill-result').textContent = 'Press STOP to reveal your Skill test.';
    skillRoller.start();
  };
}
