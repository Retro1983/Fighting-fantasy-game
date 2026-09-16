(function (root) {
  'use strict';
  // Use the shared dice CSS and pip layout for consistent visuals.
  const positions = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  function renderDice(pair, values, rolling = false) {
    pair.classList.toggle('rolling', rolling);
    pair.replaceChildren(...values.map(value => {
      const die = document.createElement('div');
      die.className = 'die';
      die.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 9; i++) {
        const pip = document.createElement('span');
        pip.className = `pip${positions[value].includes(i) ? ' visible' : ''}`;
        die.append(pip);
      }
      return die;
    }));
    pair.setAttribute('aria-label', rolling ? `${values.length === 1 ? 'One die' : 'Two dice'} rolling` : `Dice: ${values.join(' and ')}`);
  }
  function mount(container, { onComplete = null } = {}) {
  const pair = container.querySelector('#stat-dice');
  const button = container.querySelector('#roll-stat');
  const message = container.querySelector('#message');
  function render(state) {
    pair.classList.toggle('rolling', state.rolling);
    const last = Object.values(state.results).at(-1);
    const step = container.querySelector('#step');
    const rule = container.querySelector('#rule');
    if (state.complete) {
      step.textContent = 'CHARACTER COMPLETE';
      rule.textContent = 'Your final character stats are ready.';
    } else {
      const stat = state.current;
      step.textContent = `${PlayerStats.definitions.indexOf(stat) + 1} OF 3 · ${stat.label}`;
      rule.textContent = `Roll ${stat.dice === 1 ? '1 die' : '2 dice'} + ${stat.bonus} · Range ${stat.dice + stat.bonus}–${stat.dice * 6 + stat.bonus}`;
    }
    message.textContent = state.rolling ? 'Press STOP to reveal your roll.' : last ? last.calculation : 'Roll SKILL to begin.';
    if (!state.rolling) renderDice(pair, last ? last.values : [1]);
    button.hidden = state.complete;
    button.textContent = state.rolling ? `STOP ${state.current.label}` : state.complete ? 'COMPLETE' : `ROLL ${state.current.label}`;
    container.querySelector('#summary-title').textContent = state.complete ? 'Your final character stats' : 'Your character so far';
    container.querySelector('#summary').replaceChildren(...PlayerStats.definitions.map(stat => {
      const card = document.createElement('div'); card.className = 'stat-card';
      const title = document.createElement('dt'); title.textContent = stat.label;
      const detail = document.createElement('dd');
      const value = document.createElement('strong'); value.className = 'stat-value';
      value.textContent = state.results[stat.key]?.total ?? '—';
      const calculation = document.createElement('span'); calculation.className = 'calculation';
      calculation.textContent = state.results[stat.key]?.calculation ?? 'Waiting for roll';
      detail.append(value, calculation); card.append(title, detail); return card;
    }));
    if (onComplete) {
      const begin = container.querySelector('#begin-adventure');
      begin.hidden = !state.complete;
      if (state.complete) begin.focus();
    } else if (state.complete) container.querySelector('#reset-stats').focus();
  }
  const generator = PlayerStats.createGenerator({ onChange: render, onTick: values => renderDice(pair, values, true) });
  button.addEventListener('click', () => generator.getState().rolling ? generator.stop() : generator.start());
  container.querySelector('#reset-stats').addEventListener('click', () => { generator.reset(); button.focus(); });
  if (onComplete) container.querySelector('#begin-adventure').onclick = () => {
    const state = generator.getState();
    if (state.complete) onComplete(state.results);
  };
  render(generator.getState());
  return Object.freeze({ reset() { generator.reset(); }, destroy() { generator.destroy(); } });
  }
  root.PlayerStatsUI = Object.freeze({ mount, renderDice });
})(globalThis);
