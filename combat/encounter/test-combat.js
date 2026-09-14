'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Combat = require('./combat.js');
for (const [position, zone, attack, defence] of [[0,'red',0,3],[.1749,'red',0,3],[.175,'yellow',3,1],[.3999,'yellow',3,1],[.4,'green',5,0],[.5999,'green',5,0],[.6,'yellow',3,1],[.8249,'yellow',3,1],[.825,'red',0,3],[1,'red',0,3]]) {
  const fight = Combat.createEncounter({playerStamina:14});
  assert.equal(Combat.zone(position),zone);
  fight.startTurn();fight.resolve(position);assert.equal(fight.getState().opponent,15-({red:0,yellow:3,green:5})[Combat.zone(position,"attack")]);
  fight.resolve(position);assert.equal(fight.getState().opponent,15-({red:0,yellow:3,green:5})[Combat.zone(position,"attack")]);
  fight.nextTurn();fight.startTurn();fight.resolve(position);assert.equal(fight.getState().player,14-defence);
}
for(const expected of ['victory','defeat']) {
 const fight=Combat.createEncounter({playerStamina:2});
 while(!fight.getState().outcome) {fight.startTurn();fight.resolve(expected==='victory'?.5:0);fight.nextTurn();}
 assert.equal(fight.getState().outcome,expected);assert.ok(fight.getState().player>=0);assert.equal(fight.startTurn(),false);
}
const timeout=Combat.createEncounter({playerStamina:14});timeout.startTurn();timeout.resolve(.5,true);assert.equal(timeout.getState().opponent,15);timeout.nextTurn();timeout.startTurn();timeout.resolve(.5,true);assert.equal(timeout.getState().player,11);
assert.equal(Combat.timing(750).position,.5);assert.equal(Combat.timing(1500).position,1);assert.equal(Combat.timing(3000).position,0);assert.equal(Combat.timing(10000).remaining,0);
// Exercise the actual bundled UI without a browser or external resource loader.
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.ok(!/<script[^>]+src=|<link[^>]+stylesheet/.test(html));
assert.ok(!/src="(?!data:)/.test(html));
let now=0,nextId=1;const intervals=new Map(),frames=new Map(),nodes={};
function element(){return {textContent:'',children:[],hidden:false,style:{},clientWidth:300,clientHeight:300,offsetHeight:180,offsetLeft:0,clientLeft:0,classList:{toggle(){}},setAttribute(){},replaceChildren(...a){this.children=a;},append(a){this.children.push(a);},addEventListener(k,fn){this[k]=fn;},focus(){}};}
const doc={readyState:'loading',addEventListener(){},getElementById(id){return nodes[id]??=element();},createElement:element};
const ctx=vm.createContext({document:doc,window:{addEventListener(){}},performance:{now:()=>now},requestAnimationFrame(fn){const id=nextId++;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},setInterval(fn){const id=nextId++;intervals.set(id,fn);return id;},clearInterval(id){intervals.delete(id);}});
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script,ctx);
for(const stat of ['SKILL','STAMINA','LUCK']){assert.equal(nodes['roll-stat'].textContent,'ROLL '+stat);nodes['roll-stat'].click();nodes['roll-stat'].click();}
assert.equal(intervals.size,0);nodes['take-sword'].click();assert.ok(nodes['weapon-info'].textContent.includes('5 HP'));
for(let round=0;round<3;round++){
 nodes.action.click();now+=750;nodes.action.click();
 if(round<2){nodes.action.click();now+=750;nodes.action.click();}
}
assert.equal(nodes.turn.textContent,'VICTORY');assert.equal(nodes['enemy-hp'].textContent,0);assert.equal(nodes.action.hidden,true);
assert.equal(nodes['new-character'].hidden,true);
assert.ok(!html.includes('id="restart"'));
assert.equal(frames.size,0);
console.log('PASS: damage boundaries, timeouts, victory/defeat, full bundled fight; restart absent and character reroll hidden after stats.');

for (const [p, expected] of [[0,'red'],[.1949,'red'],[.195,'yellow'],[.4369,'yellow'],[.437,'green'],[.5379,'green'],[.538,'yellow'],[.7799,'yellow'],[.78,'red'],[1,'red']]) assert.equal(Combat.zone(p,'attack'),expected);
assert.ok(html.includes('id="attack-target"'));
assert.ok(!html.includes('<span class="red">'));
console.log('PASS: armour attack boundaries and embedded target; original shield boundaries preserved.');
