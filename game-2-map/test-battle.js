// Runs the actual shared UI, rules, character state and Game 2 scripts with a controlled clock.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const PlayerStats = require('../stats/stats.js');
const Combat = require('../combat/encounter/combat.js');
let now = 0, next = 0, diceTotal = 10, rolls = 0;
const timers = new Map();
const frames = new Map(), listeners = new Map(), nodes = new Map();
function element() {
  const events = new Map();
  return { hidden:false, className:'', style:{}, children:[], textContent:'', clientWidth:240, clientHeight:300,
    offsetHeight:125, offsetLeft:0, clientLeft:0, classList:{toggle(){}}, setAttribute(){}, focus(){},
    replaceChildren(...children){this.children=children;},
    addEventListener(type, fn){events.set(type,fn);}, removeEventListener(type){events.delete(type);},
    click(){events.get('click')?.();this.onclick?.();},
    attachShadow(){const children=new Map();this.shadowRoot={ innerHTML:'', appendChild(){},
      getElementById(id){if(!children.has(id)) children.set(id,element());return children.get(id);},
      replaceChildren(){children.clear();} };return this.shadowRoot;}
  };
}
const document = { currentScript:{src:'http://localhost/combat/encounter/battle-ui.js'},
  getElementById(id){if(!nodes.has(id)) nodes.set(id,element());return nodes.get(id);},
  createElement:element,querySelector:element,querySelectorAll(){return [];} };
function makeCharacter(stamina=20) {return PlayerStats.createCharacter({results:{skill:{total:10},stamina:{total:stamina},luck:{total:7}}});}
const ctx = vm.createContext({document, Combat, PlayerStats, URL, makeCharacter,
  PlayerStatsUI:{renderDice(){}},
  Dice:{createRoller(options){return {start(){options.onTick({values:[5,5],total:10});},
    stop(){rolls++;options.onStop({values:diceTotal===10?[5,5]:[6,6],total:diceTotal});},destroy(){}};}},
  performance:{now:()=>now}, requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);},
  setTimeout(fn){timers.set(++next,fn);return next;},clearTimeout(id){timers.delete(id);},
  setInterval(){throw Error('Old room timer must not start');},clearInterval(){},
  window:{addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);}},
  pendingLuck:null,stopLuckCheck(){},cancelLuckCheck(){},setupLuckCheck(){},setupCharacterCreation(){},characterSetup:{reset(){}} });
for(const file of ['combat/encounter/battle-ui.js','game-2-map/map-data.js','game-2-map/navigation/navigation.js',
  'game-2-map/inventory/inventory.js','game-2-map/combat/combat.js','game-2-map/game.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const run = code => vm.runInContext(code,ctx);
const state = () => run('activeBattle.getState()');
const action = () => nodes.get('battle').shadowRoot.getElementById('action');
function turn(elapsed){action().click();now+=elapsed * (diceTotal === 10 ? 1800 : 800) / 1500;action().click();}
function feedback(kind, text, blood) {
  const view=nodes.get('battle').shadowRoot;
  const layer=view.getElementById('combat-feedback');
  assert.equal(layer.hidden,false);
  assert.equal(layer.className,`combat-feedback feedback-${kind}`);
  assert.equal(view.getElementById('feedback-text').textContent,text);
  assert.equal(view.getElementById('feedback-blood').hidden,!blood);
  assert.ok(!view.innerHTML.includes('feedback-shield'),'No shield result overlay');
  if (blood) assert.ok(view.getElementById('feedback-blood').src.endsWith(`blood-${kind === 'partial' || kind === 'block' ? 'partial' : 'critical'}.png`));
  assert.equal(timers.size,1,'Repeated results replace the previous timer');
}
function gate() {
  assert.equal(run('activeBattle'), null, 'No combat before the test');
  const button=nodes.get('battle').shadowRoot.getElementById('skill-action');
  const before=rolls;
  button.click(); run('render();'); assert.equal(rolls,before);
  button.click(); assert.equal(rolls,before+1);
  assert.equal(run('activeBattle'),null,'Result waits for BEGIN BATTLE');
  assert.match(nodes.get('battle').shadowRoot.getElementById('skill-result').textContent,
    diceTotal===10?/SKILL TEST PASSED/:/SKILL TEST FAILED/);
  run('render();'); assert.equal(rolls,before+1);
  button.click(); run('render();'); assert.equal(rolls,before+1);
  assert.equal(run('state.player.getState().current.skill'),10);
}
function start(stamina=20){ctx.stamina=stamina;run('state.player=makeCharacter(stamina);navigateToLocation("M5");choose(LOCATIONS.M5.choices[0]);');gate();}
start();
assert.equal(run('state.location'),'MONSTER');
assert.equal(nodes.get('scene').src,'assets/monster.png');
assert.equal(state().opponent,15);
assert.match(nodes.get('battle').shadowRoot.getElementById('stats').textContent,/SKILL: 10.*LUCK: 7.*SKILL: 8/);
run('state.inventory=["sword"];state.useMode=true;selectInventoryItem(0);');
assert.equal(run('state.location'),'MONSTER','Sword must not bypass battle');
turn(0);assert.equal(state().opponent,15,'red misses');feedback('miss','MISS!',false);
turn(0);assert.equal(state().player,17);assert.equal(run('state.player.getState().current.stamina'),17);
feedback('hit','HIT!\n-3 STAMINA',true);
turn(450);assert.equal(state().opponent,12,'yellow deals 3');feedback('partial','PARTIAL HIT',true);
turn(450);assert.equal(state().player,16,'partial block costs 1');
feedback('block','PARTIAL BLOCK\n-1 STAMINA',true);
turn(750);assert.equal(state().opponent,7,'green deals 5');feedback('critical','CRITICAL HIT!',true);
turn(750);assert.equal(state().player,16,'perfect block costs 0');
feedback('perfect','PERFECT BLOCK!',false);
[...timers.values()][0]();assert.equal(timers.size,0);assert.equal(nodes.get('battle').shadowRoot.getElementById('combat-feedback').hidden,true);
assert.equal(run('state.player.getState().current.luck'),7);
assert.equal(run('state.player.getState().initial.stamina'),20);
turn(10000);assert.equal(state().opponent,7,'attack timeout misses');
turn(10000);assert.equal(state().player,13,'defence timeout costs 3');
turn(750);turn(750);turn(750);
assert.equal(run('state.location'),'MONSTER_DEATH');
assert.equal(nodes.get('scene').src,'assets/monster_death.png');
assert.equal(run('state.player.getState().current.stamina'),13);
assert.equal(frames.size,0);assert.equal(timers.size,0);assert.equal(run('activeBattle'),null);
run('choose(LOCATIONS.MONSTER_DEATH.choices[0]);');assert.equal(run('state.location'),'RA4');
start(2);turn(0);turn(0);
assert.equal(run('state.location'),'BATTLE_DEATH');assert.equal(run('state.player.getState().current.stamina'),0);
assert.equal(nodes.get('scene').src,'assets/death_3.png');
run('choose(LOCATIONS.BATTLE_DEATH.choices[0]);');assert.equal(run('state.player'),null);assert.equal(frames.size,0);
start();turn(0);action().click();assert.equal(timers.size,0);assert.equal(nodes.get('battle').shadowRoot.getElementById('combat-feedback').hidden,true);const stale=action(),lateTick=[...frames.values()][0];
run('navigateToLocation("M5");');stale.click();lateTick(now+750);
assert.equal(frames.size,0);assert.equal(timers.size,0);assert.equal(run('activeBattle'),null);
assert.equal(run('state.player.getState().current.stamina'),20);
run('navigateToLocation("MONSTER");');
assert.equal(nodes.get('battle').shadowRoot.getElementById('skill-action').textContent,'BEGIN BATTLE');
const savedRolls=rolls;nodes.get('battle').shadowRoot.getElementById('skill-action').click();assert.equal(rolls,savedRolls);assert.equal(state().opponent,15);
action().click();run('resetAdventure();');assert.equal(frames.size,0);assert.equal(listeners.size,0);
start();action().click();listeners.get('pagehide')();assert.equal(frames.size,0);assert.equal(state().phase,'result');
turn(750);assert.equal(state().player,20,'can resume safely after pagehide');
run('resetAdventure();');
start();action().click();const [frameId, timeoutTick]=[...frames.entries()][0];frames.delete(frameId);now+=10000;timeoutTick(now);
assert.equal(state().phase,'result');assert.equal(state().opponent,15);assert.equal(frames.size,0);
run('resetAdventure();');
const p=makeCharacter(2);assert.throws(()=>p.takeDamage(-1),RangeError);p.takeDamage(5);assert.equal(p.getState().current.stamina,0);
console.log('PASS: room entry, shared attack/defence and timeouts, STAMINA persistence, unchanged Luck/SKILL, victory/death routes, sword bypass prevention, leave/restart/stale callbacks and page lifecycle.');

diceTotal=12;start();turn(750);assert.equal(state().opponent,10,'FAIL attack centre uses 400ms');turn(750);assert.equal(state().player,20,'FAIL defence centre also uses 400ms');run('resetAdventure();');
console.log('PASS: Skill equality, failure, explicit begin, rerender/reentry guards, unchanged SKILL, and matching per-battle attack and defence timing.');

// UI paging must not navigate, alter stats, or lose its place on inventory renders.
run('state.player=makeCharacter(); navigateToLocation("RA1");');
assert.equal(nodes.get('storyPager').hidden,true);
assert.equal(nodes.get('storyContent').hidden,false);
run('LOCATIONS.RA1.pages=["First page", "Second page", "Last page"]; render();');
assert.equal(nodes.get('storyText').textContent,'First page');
assert.equal(nodes.get('choiceButtons').children.length,0);
run('changeStoryPage(1); render();');
assert.equal(nodes.get('pageIndicator').textContent,'2 / 3');
assert.equal(nodes.get('choiceButtons').children.length,0);
run('changeStoryPage(1);');
assert.ok(nodes.get('choiceButtons').children.length > 0);
run('changeStoryPage(-1);');
assert.equal(nodes.get('choiceButtons').children.length,0);
run('navigateToLocation("RB1"); navigateToLocation("RA1");');
assert.equal(nodes.get('storyText').textContent,'First page');
run('delete LOCATIONS.RA1.pages; navigateToLocation("MONSTER");');
assert.equal(nodes.get('storyContent').hidden,true);
assert.equal(nodes.get('battle').hidden,false);
run('navigateToLocation("RA1");');
assert.equal(nodes.get('storyContent').hidden,false);
console.log('PASS: legacy text, optional pages, final-page choices, backward paging, navigation reset and encounter/story switching.');

run('state.player=makeCharacter(); state.inventory=[]; navigateToLocation("CH1");');
nodes.get('inventoryPanel').hidden = true;
run('beginChestSelection(); takeChestItem("torch");');
assert.equal(nodes.get('inventoryPanel').hidden,false,'First pickup reveals both slots');
assert.equal(nodes.get('inventoryItem1').textContent,'Glowing Torch');
run('takeChestItem("sword"); navigateToLocation("M3"); toggleInventoryPanel();');
assert.equal(nodes.get('inventoryPanel').hidden,false,'Carried items stay visible after navigation and Inventory clicks');
assert.equal(nodes.get('inventoryItem2').textContent,'Sword');
console.log('PASS: item slots visible immediately after pickup and while carrying items.');
