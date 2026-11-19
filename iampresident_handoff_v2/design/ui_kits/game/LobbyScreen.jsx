// Lobby (source: public/pages/lobby/index.php + public/js/lobby.js)
function LobbyScreen({ match, myName, countries, onLeave, onStart, toast }) {
  const { Panel, Pill, Button, PlayerRow, CountryTag } = window.IAP_DS;
  const D = window.IAP_DATA;
  const [myCountry, setMyCountry] = React.useState(null);
  const [ready, setReady] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  const [starting, setStarting] = React.useState(false);

  const others = D.OPPONENTS[match.mode] || [];
  const players = [
    { id: 'me', name: myName, country: myCountry, ready: ready, host: true, color: D.COLORS[0] },
    ...others.map((o, i) => ({ id: 'p' + i, name: o.name, country: o.country, ready: o.ready, ai: o.ai, color: D.COLORS[i + 1] })),
  ];
  const owners = React.useMemo(() => {
    const m = {};
    players.forEach((p) => { if (p.country) m[p.country] = p.color; });
    return m;
  }, [myCountry]);

  const cname = (code) => (countries && countries[code] ? countries[code].name : code);

  const select = (code, props) => {
    if (players.some((p) => p.id !== 'me' && p.country === code)) return toast('That country is already taken.', 'err');
    setMyCountry(code);
    toast('You are now ' + D.leaderOf(code, props.name) + ' of ' + props.name, 'ok');
  };

  const start = () => {
    setStarting(true);
    const taken = players.map((p) => p.country).filter(Boolean);
    const pool = ['DEU', 'JPN', 'CAN', 'IND', 'MEX', 'AUS'].filter((c) => !taken.includes(c));
    const final = players.map((p) => ({ ...p, country: p.country || (p.id === 'me' ? 'SWE' : pool.shift()) }));
    setTimeout(() => onStart(final), 350);
  };

  return (
    <div>
      <GlobeView autoRotate selectable owners={owners} selected={myCountry} onHover={(c, p) => setHover(c ? { code: c, props: p } : null)} onSelect={select} />

      <TopBar>
        <TopTitle>{match.name}</TopTitle>
        <Pill>{match.mode.toUpperCase()}</Pill>
        {match.join_code ? <Pill icon="key" tone="gold">Code: {match.join_code}</Pill> : null}
        <div style={{ flex: 1 }} />
        <Button size="sm" variant="ghost" icon="sign-out" onClick={onLeave}>Leave</Button>
      </TopBar>

      <Panel title="Players" style={{ position: 'fixed', top: 86, left: 14, width: 270, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', zIndex: 10 }}>
        {players.map((p) => {
          const badges = [];
          if (p.ai) badges.push('ai'); else if (p.ready) badges.push('ready');
          if (p.host) badges.push('host');
          return <PlayerRow key={p.id} color={p.color} name={p.name} me={p.id === 'me'} meta={p.country ? 'Leading ' + p.country : 'Choosing country…'} badges={badges} style={{ marginTop: 4 }} />;
        })}
      </Panel>

      <Panel title="Your nation" style={{ position: 'fixed', top: 86, right: 14, width: 300, zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myCountry ? (
            <div>
              <div style={{ font: 'italic 900 30px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--teal-300)', textShadow: 'var(--text-shadow-display)' }}>{cname(myCountry)}</div>
              <div style={{ marginTop: 4, font: '500 13px/1.35 var(--font-body)', color: 'var(--gold-300)' }}>{D.leaderOf(myCountry, cname(myCountry))}</div>
            </div>
          ) : null}
          <p style={{ margin: 0, font: '400 14px/1.45 var(--font-body)', color: 'var(--text-muted)' }}>Spin the globe and click a country to lead.</p>
          <Button variant={ready ? 'primary' : 'default'} icon={ready ? 'check-circle' : undefined} onClick={() => setReady(!ready)} block>{ready ? 'Ready' : 'Ready up'}</Button>
          <Button variant="gold" icon="play" slanted block disabled={starting} onClick={start}>Start match</Button>
        </div>
      </Panel>

      {hover ? (
        <CountryTag style={{ position: 'fixed', bottom: 14, right: 14, zIndex: 10 }} name={hover.props.name} leader={'Lead as ' + D.leaderOf(hover.code, hover.props.name)} farmland={hover.props.farmland} minerals={hover.props.minerals} oil={hover.props.oil} />
      ) : null}

      <GlobeHint>Drag to rotate · scroll to zoom · click a country to claim it</GlobeHint>
    </div>
  );
}
window.LobbyScreen = LobbyScreen;
