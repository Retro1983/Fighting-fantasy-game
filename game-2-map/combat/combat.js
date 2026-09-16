// Game-specific routing and character persistence; all battle rules live in Combat.
let activeBattle = null;
let battleLocation = null;
function stopBattle() {
  if (activeBattle) activeBattle.destroy();
  activeBattle = null;
  battleLocation = null;
  document.getElementById('battle').hidden = true;
}
function syncBattle() {
  const config = LOCATIONS[state.location].encounter;
  if (!state.player || !config) { stopBattle(); return; }
  if (activeBattle && battleLocation === state.location) return;
  stopBattle();
  const player = state.player;
  if (player.getState().current.stamina === 0) return navigateToLocation(config.defeat);
  battleLocation = state.location;
  document.getElementById('battle').hidden = false;
  activeBattle = BattleUI.mount(document.getElementById('battle'), {
    player: player.getState().current,
    enemy: { ...Combat.beast, ...config.enemy },
    onDamage(amount) { player.takeDamage(amount); renderPlayerStats(); },
    onComplete(outcome) { navigateToLocation(config[outcome === 'victory' ? 'victory' : 'defeat']); }
  });
}
