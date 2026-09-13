(function () {
  'use strict';
  const pair = document.querySelector('#stat-dice');
  const button = document.querySelector('#roll-stat');
  const message = document.querySelector('#message');
  // Use the shared dice CSS and pip layout for consistent visuals.
  const positions = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  function renderDice(values, rolling = false) {
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
  function render(state) {
    pair.classList.toggle('rolling', state.rolling);
    const last = Object.values(state.results).at(-1);
    const step = document.querySelector('#step');
    const rule = document.querySelector('#rule');
    if (state.complete) {
      step.textContent = 'CHARACTER COMPLETE';
      rule.textContent = 'Your final character stats are ready.';
    } else {
      const stat = state.current;
      step.textContent = `${PlayerStats.definitions.indexOf(stat) + 1} OF 3 · ${stat.label}`;
      rule.textContent = `Roll ${stat.dice === 1 ? '1 die' : '2 dice'} + ${stat.bonus} · Range ${stat.dice + stat.bonus}–${stat.dice * 6 + stat.bonus}`;
    }
    message.textContent = state.rolling ? 'Press STOP to reveal your roll.' : last ? last.calculation : 'Roll SKILL to begin.';
    if (!state.rolling) renderDice(last ? last.values : [1]);
    button.hidden = state.complete;
    button.textContent = state.rolling ? `STOP ${state.current.label}` : state.complete ? 'COMPLETE' : `ROLL ${state.current.label}`;
    document.querySelector('#summary-title').textContent = state.complete ? 'Your final character stats' : 'Your character so far';
    document.querySelector('#summary').replaceChildren(...PlayerStats.definitions.map(stat => {
      const card = document.createElement('div'); card.className = 'stat-card';
      const title = document.createElement('dt'); title.textContent = stat.label;
      const detail = document.createElement('dd');
      const value = document.createElement('strong'); value.className = 'stat-value';
      value.textContent = state.results[stat.key]?.total ?? '—';
      const calculation = document.createElement('span'); calculation.className = 'calculation';
      calculation.textContent = state.results[stat.key]?.calculation ?? 'Waiting for roll';
      detail.append(value, calculation); card.append(title, detail); return card;
    }));
    if (state.complete) document.querySelector('#reset-stats').focus();
  }
  const generator = PlayerStats.createGenerator({ onChange: render, onTick: values => renderDice(values, true) });
  button.addEventListener('click', () => generator.getState().rolling ? generator.stop() : generator.start());
  document.querySelector('#reset-stats').addEventListener('click', () => { generator.reset(); button.focus(); });
  window.addEventListener('pagehide', () => generator.reset());
  render(generator.getState());
})();
