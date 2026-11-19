// In-match screen (source: public/pages/game/index.php + public/js/game.js).
// Engine is faked client-side from GameConfig values; one demo tick = 6s (real default: 20s).
const GAME_TICK_MS = 6000;
const GAME_CONQUESTS = { SAU: ['YEM', 'OMN', 'JOR'], PRK: ['KOR'], BRA: ['URY', 'PRY', 'BOL'], FRA: ['BEL', 'CHE'], NOR: ['FIN'], DEU: ['AUT', 'CZE'], IND: ['NPL', 'BGD'], MEX: ['GTM'], JPN: [], CAN: [], AUS: [] };
let gameUid = 100;

function GameScreen({ match, lobbyPlayers, countries, onExit, toast }) {
  const { Panel, Pill, Button, ResourceChip, PlayerRow, BuildItem, FeedEvent, ChatMessage, Input, CountryTag, Icon } = window.IAP_DS;
  const D = window.IAP_DATA;
  const cname = (code) => (countries[code] ? countries[code].name : code);

  const [S, setS] = React.useState(() => {
    const players = lobbyPlayers.map((p) => {
      const per = D.persona(p.country, cname(p.country));
      return { id: p.id, display_name: per.name, leader_title: per.title, country: p.country, color: p.color, is_ai: !!p.ai, pop: (countries[p.country] && countries[p.country].pop) || 1e7 };
    });
    const territories = {};
    players.forEach((p) => { territories[p.country] = p.id; });
    const me = players[0];
    const buildings = D.START_BUILDINGS.map((t, i) => ({ id: 'b' + i, country: me.country, type: t, status: 'active', complete_at: 0 }));
    const res = { ...D.START, food: Math.max(D.START.food, Math.ceil(me.pop * 1e-6 * 2 * 12)) };
    return { day: 0, players, territories, buildings, res, events: [{ id: 1, type: 'match_started', text: 'The match has begun.', day: 0 }] };
  });
  const [chat, setChat] = React.useState(() => match.mode === 'online' && S.players[1]
    ? [{ id: 1, name: S.players[1].display_name, color: S.players[1].color, body: 'Anyone selling food? Paying in oil.' }]
    : []);
  const [msg, setMsg] = React.useState('');
  const [selected, setSelected] = React.useState(S.players[0].country);
  const [hover, setHover] = React.useState(null);
  const [vw, setVw] = React.useState(window.innerWidth);
  React.useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const wide = vw >= 1680;
  const tight = vw < 1100;

  // ---- tick ----
  React.useEffect(() => {
    const step = (s) => {
      const day = s.day + 1;
      const me = s.players[0];
      const props = countries[me.country] || { farmland: 50, minerals: 50, oil: 50 };
      const r = { ...s.res };
      const events = s.events.slice();
      const buildings = s.buildings.map((b) => {
        if (b.status === 'building' && b.complete_at <= day) {
          events.unshift({ id: ++gameUid, type: 'build_complete', actor: me.display_name, text: 'completed a ' + D.BUILDINGS[b.type].name.toLowerCase() + ' in ' + cname(b.country), day });
          return { ...b, status: 'active' };
        }
        return b;
      });
      const active = buildings.filter((b) => b.status === 'active');
      const demand = active.reduce((a, b) => a + (D.BUILDINGS[b.type].needs_energy || 0), 0);
      let energyIn = 0;
      active.forEach((b) => { if (b.type === 'power_plant') { energyIn += 170; r.oil = Math.max(0, r.oil - 18); } });
      const factor = r.energy + energyIn >= demand ? 1 : 0.5;
      r.energy = Math.max(0, r.energy + energyIn - demand);
      active.forEach((b) => {
        const B = D.BUILDINGS[b.type];
        if (b.type === 'power_plant') return;
        const scale = B.scale ? (props[B.scale] || 50) / 50 : 1;
        Object.keys(B.produces || {}).forEach((k) => { r[k] += B.produces[k] * scale * factor; });
        Object.keys(B.consumes || {}).forEach((k) => { r[k] = Math.max(0, r[k] - B.consumes[k]); });
      });
      const popM = me.pop * 1e-6;
      r.food -= popM * 2; r.gold += popM * 2;
      const fed = r.food >= 0;
      if (!fed) r.food = 0;
      const housing = active.filter((b) => b.type === 'housing').length;
      const cap = ((countries[me.country] && countries[me.country].pop) || me.pop) * 1.25 + housing * 40e6;
      const players = s.players.map((p, i) => (i === 0 ? { ...p, pop: fed ? Math.min(cap, p.pop * 1.01) : p.pop * 0.985 } : { ...p, pop: p.pop * 1.006 }));
      let territories = s.territories;
      if (day % 3 === 0) {
        const attackers = players.slice(1).filter((p) => (GAME_CONQUESTS[p.country] || []).length);
        const a = attackers[(day / 3 - 1) % Math.max(1, attackers.length)];
        if (a) {
          const target = GAME_CONQUESTS[a.country].find((t) => countries[t] && !territories[t]);
          if (target) {
            territories = { ...territories, [target]: a.id };
            events.unshift({ id: ++gameUid, type: 'conquest', actor: a.display_name, text: 'conquered ' + cname(target), day });
          }
        }
      }
      return { ...s, day, res: r, buildings, players, territories, events: events.slice(0, 40) };
    };
    const t = setInterval(() => setS(step), GAME_TICK_MS);
    return () => clearInterval(t);
  }, []);

  const me = S.players[0];
  const owners = React.useMemo(() => {
    const color = {}; S.players.forEach((p) => { color[p.id] = p.color; });
    const m = {}; Object.keys(S.territories).forEach((c) => { m[c] = color[S.territories[c]]; });
    return m;
  }, [S.territories]);
  const terrCount = (id) => Object.values(S.territories).filter((x) => x === id).length;
  const standings = S.players.slice().sort((a, b) => terrCount(b.id) - terrCount(a.id));

  const canAfford = (type) => Object.entries(D.BUILDINGS[type].cost).every(([k, v]) => (S.res[k] || 0) >= v);
  const build = (type) => {
    const B = D.BUILDINGS[type];
    if (!canAfford(type)) return toast('Not enough resources.', 'err');
    setS((s) => {
      const r = { ...s.res };
      Object.keys(B.cost).forEach((k) => { r[k] -= B.cost[k]; });
      return { ...s, res: r, buildings: [...s.buildings, { id: 'b' + (++gameUid), country: selected, type, status: 'building', complete_at: s.day + B.build_ticks }] };
    });
    toast(B.name + ' started.', 'ok');
  };

  const send = () => {
    const body = msg.trim();
    if (!body) return;
    setMsg('');
    setChat((c) => [...c, { id: ++gameUid, name: me.display_name, color: me.color, body }]);
  };
  const chatRef = React.useRef(null);
  React.useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat]);

  const owned = selected && S.territories[selected] === me.id;
  const here = S.buildings.filter((b) => b.country === selected);
  const ownerOf = (code) => S.players.find((p) => p.id === S.territories[code]);
  const persona = (me.leader_title ? me.leader_title + ' ' : '') + me.display_name + ' · ' + cname(me.country);

  return (
    <div>
      <GlobeView autoRotate={false} selectable owners={owners} focusCode={me.country} onHover={(c, p) => setHover(c ? { code: c, props: p } : null)} onSelect={(c) => setSelected(c)} />

      <TopBar>
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex' }}><TopTitle>{tight ? me.display_name : persona}</TopTitle></div>
        <Pill solid tone="gold" icon="sun" style={{ flexShrink: 0 }}>Day {S.day}</Pill>
        <div style={{ display: 'flex', gap: tight ? 4 : 8, flexWrap: 'nowrap', flexShrink: 0 }}>
          {D.RES.map((k) => <ResourceChip key={k} resource={k} value={S.res[k]} showName={wide} style={tight ? { padding: '3px 8px 3px 3px', gap: 4 } : undefined} />)}
        </div>
        <Button size="sm" variant="ghost" icon="sign-out" onClick={onExit} style={{ marginLeft: 4, flexShrink: 0 }}>{tight ? '' : 'Exit'}</Button>
      </TopBar>

      <Panel title="World standings" style={{ position: 'fixed', top: 86, left: 14, width: 270, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', zIndex: 10 }}>
        {standings.map((p) => (
          <PlayerRow key={p.id} color={p.color} me={p.id === me.id} badges={p.is_ai ? ['ai'] : []} style={{ marginTop: 4 }}
            name={(p.leader_title ? p.leader_title + ' ' : '') + p.display_name}
            meta={<React.Fragment><Icon name="map-trifold" size={11} />{terrCount(p.id)}<span>·</span><Icon name="users-three" size={11} />{window.IAP_UI.num(p.pop)} pop</React.Fragment>} />
        ))}
      </Panel>

      <Panel title="Build" style={{ position: 'fixed', top: 86, right: 14, width: 300, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', zIndex: 10 }}>
        <div style={{ font: '400 14px/1.4 var(--font-body)', color: 'var(--text-muted)', marginBottom: 12 }}>
          {!selected ? 'Click a country you control to build.' : (
            <React.Fragment><b style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{cname(selected)}</b>{owned ? '' : ' — not yours'}</React.Fragment>
          )}
        </div>
        {owned ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(D.BUILDINGS).map((type) => {
              const B = D.BUILDINGS[type];
              return <BuildItem key={type} name={B.name} icon={B.icon} tone={B.tone} cost={B.cost} days={B.build_ticks} description={B.desc} disabled={!canAfford(type)} onClick={() => build(type)} />;
            })}
          </div>
        ) : null}
        {here.length ? (
          <div>
            <div style={{ margin: '14px 0 6px', font: '500 12px/1 var(--font-body)', color: 'var(--text-muted)' }}>Buildings here</div>
            {here.map((b) => {
              const B = D.BUILDINGS[b.type];
              return (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '400 13px/1 var(--font-body)', padding: '4px 0' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name={B.icon} size={14} color={B.tone} />{B.name}</span>
                  {b.status === 'active'
                    ? <Icon name="check-circle" size={15} color="var(--green-300)" />
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', animation: 'iap-pulse 1.6s ease-in-out infinite' }}><Icon name="hourglass" size={12} />day {b.complete_at}</span>}
                </div>
              );
            })}
          </div>
        ) : null}
      </Panel>

      <Panel title="Dispatches" style={{ position: 'fixed', bottom: 14, left: 14, width: 360, zIndex: 10 }}>
        <div style={{ maxHeight: 150, overflow: 'auto' }}>
          {S.events.map((e) => <FeedEvent key={e.id} type={e.type} actor={e.actor} day={e.day}>{e.text}</FeedEvent>)}
        </div>
        <div ref={chatRef} style={{ maxHeight: 140, overflow: 'auto', margin: '8px 0' }}>
          {chat.map((m) => <ChatMessage key={m.id} name={m.name} color={m.color}>{m.body}</ChatMessage>)}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input size="sm" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Message the world…" maxLength={400} />
          <Button size="sm" onClick={send}>Send</Button>
        </div>
      </Panel>

      {hover ? (() => {
        const o = ownerOf(hover.code);
        return <CountryTag style={{ position: 'fixed', bottom: 14, right: 14, zIndex: 11 }} name={hover.props.name} owner={o ? o.display_name : 'Neutral'} ownerColor={o ? o.color : undefined} farmland={hover.props.farmland} minerals={hover.props.minerals} oil={hover.props.oil} />;
      })() : null}

      <GlobeHint>Drag to rotate · scroll to zoom · click your land to build</GlobeHint>
    </div>
  );
}
window.GameScreen = GameScreen;
