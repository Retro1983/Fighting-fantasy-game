/* Reusable view over Combat rules. Hosts own character persistence and outcome routing. */
(function (root) {
  'use strict';
  const assets = new URL('.', document.currentScript.src);
  function mount(host, { player, enemy = Combat.beast, onDamage = () => {}, onComplete = () => {} }) {
    const view = host.shadowRoot || host.attachShadow({ mode: 'open' });
    view.innerHTML = `<link rel="stylesheet" href="${new URL('encounter.css', assets)}">
      <style>:host { display:block; flex-shrink:0; } main { width:100%; }
      button { padding:12px; background:#30291f; color:#f1e8d8; border:1px solid #715e42; cursor:pointer; }
      #attack-area { max-width:240px; } #defence-area { max-width:240px; }
      #attack-sword { width:85px; } #defence-sword { height:125px; }
      .scores { gap:20px; } .scores strong { font-size:28px; }</style>
      <main><p id="stats"></p>
      <div class="scores"><p>You <strong id="player-hp"></strong> STAMINA</p>
      <p><span id="enemy-name"></span> <strong id="enemy-hp"></strong> STAMINA</p></div>
      <h2 id="turn"></h2><p id="clock">Time: 10.0</p>
      <div id="attack-area" class="arena"><img id="attack-target" src="${new URL('../attack-target.png', assets)}" alt="Armour attack target">
      <img id="attack-sword" class="moving-sword" src="${new URL('../sword.png', assets)}" alt="Sword"><div id="attack-bar"></div></div>
      <div id="defence-area" class="arena" hidden><img id="shield" src="${new URL('../../defence/shield.png', assets)}" alt="Shield defence target">
      <img id="defence-sword" class="moving-sword" src="${new URL('../../defence/sword.png', assets)}" alt="Enemy sword"></div>
      <p id="rules"></p><p id="result" role="status" aria-live="polite"></p>
      <button id="action" type="button">START ATTACK</button></main>`;
    const $ = id => view.getElementById(id);
    const encounter = Combat.createEncounter({ playerStamina: player.stamina, enemy });
    let frame = null, startedAt = 0, position = 0, disposed = false;
    $('stats').textContent = `Your SKILL: ${player.skill} · LUCK: ${player.luck} · Enemy SKILL: ${enemy.skill ?? '—'}`;
    $('enemy-name').textContent = enemy.name;
    function cancel() { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
    function place() {
      const attack = encounter.getState().turn === 'attack';
      if (attack) {
        const bar = $('attack-bar');
        $('attack-sword').style.left = `${bar.offsetLeft + bar.clientLeft + position * bar.clientWidth}px`;
      } else {
        $('defence-sword').style.left = `${position * $('shield').clientWidth}px`;
        $('defence-sword').style.top = `${$('shield').clientHeight / 2 - $('defence-sword').offsetHeight + 4}px`;
      }
    }
    function render() {
      const state = encounter.getState(), attack = state.turn === 'attack';
      $('player-hp').textContent = state.player;
      $('enemy-hp').textContent = state.opponent;
      $('turn').textContent = state.outcome ? state.outcome.toUpperCase() : attack ? 'YOUR ATTACK' : 'ENEMY ATTACK — DEFEND';
      $('attack-area').hidden = !attack; $('defence-area').hidden = attack;
      $('rules').textContent = attack
        ? `Red zone: critical hit · Brown zone: partial hit · Black zone: miss`
        : `Centre: perfect block, 0 STAMINA lost · Inner sides: partial block, ${enemy.partialDamage} STAMINA lost · Outer edges: ${enemy.maxDamage} STAMINA lost`;
      $('action').hidden = Boolean(state.outcome);
      $('action').textContent = state.phase === 'rolling' ? (attack ? 'ATTACK' : 'DEFEND') : state.phase === 'result' ? (attack ? 'START DEFENCE' : 'START ATTACK') : 'START ATTACK';
      $('result').textContent = state.last && state.phase !== 'rolling'
        ? `${state.last.label} — ${state.last.turn === 'attack' ? enemy.name + ' loses' : 'You lose'} ${state.last.damage} STAMINA.` : '';
      place();
    }
    function settle(timedOut) {
      cancel();
      const before = encounter.getState().player;
      const state = encounter.resolve(position, timedOut);
      if (before !== state.player) onDamage(before - state.player);
      render();
      if (state.outcome) onComplete(state.outcome);
    }
    function update(now) {
      const sample = Combat.timing(now - startedAt);
      position = sample.position;
      $('clock').textContent = `Time: ${(sample.remaining / 1000).toFixed(1)}`;
      place();
      if (!sample.remaining) { settle(true); return false; }
      return true;
    }
    function tick(now) { if (!disposed && update(now)) frame = requestAnimationFrame(tick); }
    function act() {
      if (disposed) return;
      if (encounter.getState().phase === 'rolling') { if (update(performance.now())) settle(false); return; }
      encounter.nextTurn();
      if (!encounter.startTurn()) return;
      position = 0; startedAt = performance.now();
      $('clock').textContent = 'Time: 10.0'; render(); frame = requestAnimationFrame(tick);
    }
    // Leaving the page freezes the current turn safely, including bfcache restores.
    function suspend() { if (!disposed && encounter.getState().phase === 'rolling') settle(true); }
    $('action').addEventListener('click', act);
    window.addEventListener('resize', place);
    window.addEventListener('pagehide', suspend);
    for (const id of ['attack-target', 'attack-sword', 'shield', 'defence-sword']) $(id).addEventListener('load', place);
    render();
    return Object.freeze({
      getState: encounter.getState,
      destroy() {
        disposed = true; cancel();
        $('action').removeEventListener('click', act);
        window.removeEventListener('resize', place);
        window.removeEventListener('pagehide', suspend);
        for (const id of ['attack-target', 'attack-sword', 'shield', 'defence-sword']) $(id).removeEventListener('load', place);
        view.replaceChildren();
      }
    });
  }
  root.BattleUI = Object.freeze({ mount });
})(globalThis);
