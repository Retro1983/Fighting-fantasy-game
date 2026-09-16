const statsDemo = PlayerStatsUI.mount(document);
window.addEventListener('pagehide', () => statsDemo.reset());
