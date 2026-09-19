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
const frames = new Map(), listeners = new Map(), nodes = new Map();
function element() {
  const events = new Map();
  return { hidden:false, style:{}, children:[], textContent:'', clientWidth:240, clientHeight:300,
    offsetHeight:125, offsetLeft:0, clientLeft:0, classList:{toggle(){}}, setAttribute(){}, focus(){},
    replaceChildren(...children){this.children=children;},
    addEventListener(type, fn){events.set(type,fn);}, removeEventListener(type){events.delete(type);},
    click(){events.get('click')?.();this.onclick?.();},
    attachShadow(){const children=new Map();this.shadowRoot={ innerHTML:'',
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
  setInterval(){throw Error('Old room timer must not start');},clearInterval(){},
  window:{addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);}},
  pendingLuck:null,cancelLuckCheck(){},setupLuckCheck(){},setupCharacterCreation(){},characterSetup:{reset(){}} });
for(const file of ['combat/encounter/battle-ui.js','game-2-map/map-data.js','game-2-map/navigation/navigation.js',
  'game-2-map/inventory/inventory.js','game-2-map/combat/combat.js','game-2-map/game.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const run = code => vm.runInContext(code,ctx);
const state = () => run('activeBattle.getState()');
const action = () => nodes.get('battle').shadowRoot.getElementById('action');
function turn(elapsed){action().click();now+=elapsed * (diceTotal === 10 ? 1800 : 800) / 1500;action().click();}
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
turn(0);assert.equal(state().opponent,15,'red misses');
turn(0);assert.equal(state().player,17);assert.equal(run('state.player.getState().current.stamina'),17);
turn(450);assert.equal(state().opponent,12,'yellow deals 3');
turn(450);assert.equal(state().player,16,'partial block costs 1');
turn(750);assert.equal(state().opponent,7,'green deals 5');
turn(750);assert.equal(state().player,16,'perfect block costs 0');
assert.equal(run('state.player.getState().current.luck'),7);
assert.equal(run('state.player.getState().initial.stamina'),20);
turn(10000);assert.equal(state().opponent,7,'attack timeout misses');
turn(10000);assert.equal(state().player,13,'defence timeout costs 3');
turn(750);turn(750);turn(750);
assert.equal(run('state.location'),'MONSTER_DEATH');
assert.equal(nodes.get('scene').src,'assets/monster_death.png');
assert.equal(run('state.player.getState().current.stamina'),13);
assert.equal(frames.size,0);assert.equal(run('activeBattle'),null);
run('choose(LOCATIONS.MONSTER_DEATH.choices[0]);');assert.equal(run('state.location'),'RA4');
start(2);turn(0);turn(0);
assert.equal(run('state.location'),'BATTLE_DEATH');assert.equal(run('state.player.getState().current.stamina'),0);
assert.equal(nodes.get('scene').src,'assets/death_3.png');
run('choose(LOCATIONS.BATTLE_DEATH.choices[0]);');assert.equal(run('state.player'),null);assert.equal(frames.size,0);
start();action().click();const stale=action(),lateTick=[...frames.values()][0];
run('navigateToLocation("M5");');stale.click();lateTick(now+750);
assert.equal(frames.size,0);assert.equal(run('activeBattle'),null);
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
