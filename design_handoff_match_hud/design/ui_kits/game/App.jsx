// App shell: screen routing + toast host (source: public/js/ui.js toasts).
function App() {
  const { Toast } = window.IAP_DS;
  const D = window.IAP_DATA;
  const hash = (location.hash || '').replace('#', '');
  const [screen, setScreen] = React.useState(['lobby', 'game'].includes(hash) ? hash : 'home');
  const [name, setName] = React.useState('');
  const [match, setMatch] = React.useState(hash === 'lobby' || hash === 'game' ? { id: 4821, name: 'World Stage', mode: hash === 'game' ? 'single' : 'online', join_code: null } : null);
  const [roster, setRoster] = React.useState(null);
  const [countries, setCountries] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    fetch(D.GEO_URL).then((r) => r.json()).then((fc) => {
      const m = {}; fc.features.forEach((f) => { m[f.properties.code] = f.properties; });
      setCountries(m);
    });
  }, []);

  const toast = React.useCallback((msg, kind) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind: kind || 'default', out: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2600);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2850);
  }, []);

  const displayName = name.trim() || 'Guest';
  const go = (s) => { setScreen(s); history.replaceState(null, '', '#' + s); };
  const create = (mode) => {
    setMatch({ id: 4830, name: displayName + "'s match", mode, join_code: mode === 'private' ? 'K7QX2M' : null });
    go('lobby');
  };

  // Default roster when deep-linking straight to #game.
  React.useEffect(() => {
    if (screen === 'game' && !roster) {
      setRoster([{ id: 'me', name: displayName, country: 'SWE', color: D.COLORS[0] }, ...D.OPPONENTS.single.map((o, i) => ({ id: 'p' + i, name: o.name, country: o.country, ai: true, color: D.COLORS[i + 1] }))]);
    }
  }, [screen]);

  let view = null;
  if (screen === 'home') {
    view = <HomeScreen name={name} setName={setName} toast={toast} onCreate={create}
      onJoinCode={(code) => { setMatch({ id: 4831, name: 'Private room', mode: 'private', join_code: code }); go('lobby'); }}
      onJoinMatch={(m) => { setMatch({ id: m.id, name: m.name, mode: 'online', join_code: null }); go('lobby'); }} />;
  } else if (screen === 'lobby' && match) {
    view = <LobbyScreen key={'l' + match.id} match={match} myName={displayName} countries={countries} toast={toast} onLeave={() => go('home')} onStart={(players) => { setRoster(players); go('game'); }} />;
  } else if (screen === 'game' && match && roster && countries) {
    view = <GameScreen key={'g' + match.id} match={match} lobbyPlayers={roster} countries={countries} toast={toast} onExit={() => { setRoster(null); go('home'); }} />;
  }

  return (
    <React.Fragment>
      {view}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map((t) => <Toast key={t.id} kind={t.kind} style={{ opacity: t.out ? 0 : 1, transition: 'opacity .25s ease' }}>{t.msg}</Toast>)}
      </div>
    </React.Fragment>
  );
}

// UI.num / UI.int from public/js/ui.js
window.IAP_UI = {
  num(n) { n = Number(n) || 0; const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'; if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return Math.round(n).toString(); },
  int(n) { return Math.round(Number(n) || 0).toLocaleString(); },
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
