let pendingLuck = null;
let luckRoller = null;
let luckDiceView = null;

function setupLuckCheck() {
  const view = document.getElementById('luckDice').attachShadow({ mode: 'open' });
  view.innerHTML = `<link rel="stylesheet" href="../dice/dice.css">
    <style>.dice-pair { margin: 12px 0; padding: 22px 0; gap: 28px; }
    .die { width: 88px; padding: 14px; gap: 7px; }</style>
    <div class="dice-pair" role="img" aria-label="Two dice ready"></div>`;
  luckDiceView = view.querySelector('.dice-pair');
  window.addEventListener('pagehide', cancelLuckCheck);
  window.addEventListener('pageshow', () => { if (state.player) render(); });
}

function cancelLuckCheck() {
  if (luckRoller) luckRoller.destroy();
  luckRoller = null;
  pendingLuck = null;
}

function beginLuckCheck(choice) {
  if (pendingLuck) return;
  pendingLuck = choice;
  state.luckResult = null;
  luckRoller = Dice.createRoller({
    onTick(roll) { PlayerStatsUI.renderDice(luckDiceView, roll.values, true); },
    onStop(roll) {
      if (!pendingLuck) return;
      const savedChoice = pendingLuck;
      const result = state.player.testLuck(roll);
      PlayerStatsUI.renderDice(luckDiceView, result.values);
      cancelLuckCheck();
      navigateToLocation(result.successful ? savedChoice.successTarget : savedChoice.target,
        result.successful ? savedChoice.successMessage : '', result);
    }
  });
  render();
  luckRoller.start();
  document.getElementById('stopLuckButton').focus();
}

function stopLuckCheck() {
  if (pendingLuck && luckRoller) luckRoller.stop();
}
