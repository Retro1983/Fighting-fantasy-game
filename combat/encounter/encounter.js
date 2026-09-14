(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let character = null, encounter = null, frame = null, startedAt = 0, position = 0;
  const faces = [[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
  function displayDice(values) {
    $('stat-dice').replaceChildren(...values.map(value => {
      const die = document.createElement('div'); die.className = 'die';
      for (let i=0; i<9; i++) { const pip=document.createElement('span'); pip.className='pip'+(faces[value].includes(i)?' visible':''); die.append(pip); }
      return die;
    }));
    $('stat-dice').setAttribute('aria-label', `Dice: ${values.join(' and ')}`);
  }
  const generator = PlayerStats.createGenerator({
    onTick: result => displayDice(result),
    onChange(state) {
      $('stat-dice').classList.toggle('rolling',state.rolling);
      $('roll-stat').textContent = state.rolling ? 'STOP' : state.complete ? 'COMPLETE' : `ROLL ${state.current.label}`;
      $('roll-stat').hidden = state.complete;
      $('new-character').hidden = state.complete;
      $('stat-rule').textContent = state.complete ? 'Character ready' : `${state.current.label}: ${state.current.dice} ${state.current.dice===1?'die':'dice'} + ${state.current.bonus}`;
      const latest=Object.values(state.results).at(-1);
      $('stat-message').textContent = state.rolling ? 'Press STOP to save this roll.' : latest ? latest.calculation : 'Roll all three stats to begin.';
      if(!state.rolling) displayDice(latest ? latest.values : [1]);
      $('saved-stats').textContent = Object.entries(state.results).map(([key,r])=>`${key.toUpperCase()}: ${r.total}`).join(' · ');
      if(state.complete) {
        character=state.results; $('pickup').hidden=false;
        $('take-sword').focus();
      }
    }
  });
  function cancel() { if(frame!==null) cancelAnimationFrame(frame); frame=null; }
  function place() {
    if(!encounter) return;
    if(encounter.getState().turn==='attack') {
      const bar=$('attack-bar');
      $('attack-sword').style.left=`${bar.offsetLeft + bar.clientLeft + position*bar.clientWidth}px`;
    } else {
      const shield=$('shield');
      $('defence-sword').style.left=`${position*shield.clientWidth}px`;
      $('defence-sword').style.top=`${shield.clientHeight/2-$('defence-sword').offsetHeight+4}px`;
    }
  }
  function renderFight() {
    const state=encounter.getState(), attack=state.turn==='attack';
    $('player-hp').textContent=state.player;
    $('enemy-hp').textContent=state.opponent;
    $('turn').textContent=state.outcome ? (state.outcome==='victory'?'VICTORY':'DEFEAT') : attack ? 'YOUR ATTACK' : 'ENEMY ATTACK — DEFEND';
    $('attack-area').hidden=!attack; $('defence-area').hidden=attack;
    $('rules').textContent=attack ? 'Red chest strip: 5 HP damage · Brown chest: 3 HP · Grey outer armour or timeout: miss' : 'Steel centre: perfect block, 0 HP lost · Inner sides: partial block, 1 HP lost · Outer edges or timeout: 3 HP lost';
    $('action').hidden=state.phase==='complete';
    $('action').textContent=state.phase==='rolling' ? (attack?'ATTACK':'DEFEND') : state.phase==='result' ? (attack?'START DEFENCE':'START ATTACK') : 'START ATTACK';
    if(state.last && state.phase!=='rolling') $('result').textContent=`${state.last.label} — ${state.last.turn==='attack'?'Beast loses':'You lose'} ${state.last.damage} STAMINA.${state.outcome ? state.outcome==='victory'?' The beast is defeated.':' You have fallen.':''}`;
    place();
  }
  function settle(timedOut) { cancel(); encounter.resolve(position,timedOut); renderFight(); }
  function update(now) {
    const sample=Combat.timing(now-startedAt); position=sample.position;
    $('clock').textContent=`Time: ${(sample.remaining/1000).toFixed(1)}`; place();
    if(sample.remaining===0) { settle(true); return false; } return true;
  }
  function tick(now) { if(update(now)) frame=requestAnimationFrame(tick); }
  function startTurn() {
    if(encounter.getState().phase==='result') encounter.nextTurn();
    if(!encounter.startTurn()) return;
    position=0; startedAt=performance.now(); $('result').textContent=''; $('clock').textContent='Time: 10.0';
    renderFight(); frame=requestAnimationFrame(tick);
  }
  function resetFight() {
    cancel(); encounter=Combat.createEncounter({playerStamina:character.stamina.total}); position=0;
    $('clock').textContent='Time: 10.0'; $('result').textContent=''; renderFight();
  }
  $('roll-stat').addEventListener('click',()=>generator.getState().rolling?generator.stop():generator.start());
  $('take-sword').addEventListener('click',()=>{
    $('creation').hidden=true; $('pickup').hidden=true; $('fight').hidden=false;
    $('encounter-heading').hidden=false;
    $('weapon-info').textContent=`Sword equipped. Maximum damage: ${Combat.sword.maxDamage} HP.`;
    resetFight(); $('action').focus();
  });
  $('action').addEventListener('click',()=>{
    if(encounter.getState().phase==='rolling') { if(update(performance.now())) settle(false); }
    else startTurn();
  });
  $('new-character').addEventListener('click',()=>{
    $('encounter-heading').hidden=true;
    cancel();encounter=null;character=null;$('creation').hidden=false;$('pickup').hidden=true;$('fight').hidden=true;
    generator.reset();$('roll-stat').focus();
  });
  window.addEventListener('resize',place);
  for(const id of ['shield','attack-target','attack-sword','defence-sword']) $(id).addEventListener('load',place);
  window.addEventListener('pagehide',()=>{cancel();generator.reset();});
  window.addEventListener('pageshow',event=>{if(event.persisted) $('new-character').click();});
  generator.reset();
})();
