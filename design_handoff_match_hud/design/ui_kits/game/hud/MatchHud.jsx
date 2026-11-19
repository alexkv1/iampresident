// Match HUD mockup — composes the HUD regions over the live globe on a 1440×900 stage scaled to fit.
const HUD_W = 1440, HUD_H = 900;
const HUD_TWEAKS = /*EDITMODE-BEGIN*/{
  "scenario": "attack",
  "panels": "frosted",
  "myColor": "#42d4f4"
}/*EDITMODE-END*/;

function hudShape(feature) {
  if (!feature) return null;
  const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const rings = polys.map((p) => p[0]);
  const all = [].concat(...rings);
  const lons = all.map((c) => c[0]);
  const wrap = Math.max(...lons) - Math.min(...lons) > 180;
  const fx = (lon) => (wrap && lon < 0 ? lon + 360 : lon);
  const lat0 = all.reduce((a, c) => a + c[1], 0) / all.length;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const pts = rings.map((r) => r.map((c) => [fx(c[0]) * kx, -c[1]]));
  const flat = [].concat(...pts);
  const minX = Math.min(...flat.map((p) => p[0])), maxX = Math.max(...flat.map((p) => p[0]));
  const minY = Math.min(...flat.map((p) => p[1])), maxY = Math.max(...flat.map((p) => p[1]));
  const s = 92 / Math.max(maxX - minX, maxY - minY);
  const ox = (100 - (maxX - minX) * s) / 2, oy = (100 - (maxY - minY) * s) / 2;
  return pts.map((r) => 'M' + r.map((p) => ((p[0] - minX) * s + ox).toFixed(1) + ' ' + ((p[1] - minY) * s + oy).toFixed(1)).join('L') + 'Z').join('');
}

function MatchHud() {
  const { Toast } = window.IAP_DS;
  const H = window.HUD_DATA, D = window.IAP_DATA;
  const _p = new URLSearchParams(window.location.search);          // visual-test params
  if (_p.get('scenario')) HUD_TWEAKS.scenario = _p.get('scenario');
  const [t, setTweak] = useTweaks(HUD_TWEAKS);
  const sc = H.scenarios[t.scenario] || H.scenarios.calm;
  const solid = t.panels === 'solid';

  const [scale, setScale] = React.useState(1);
  const [geo, setGeo] = React.useState(null);
  const [mode, setMode] = React.useState(_p.get('mode') || 'build');
  const [selected, setSelected] = React.useState('SWE');
  const [lens, setLens] = React.useState('political');
  const [hover, setHover] = React.useState(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [day, setDay] = React.useState(H.DAY);
  const [secs, setSecs] = React.useState(12);
  const [queue, setQueue] = React.useState(H.buildingsHere.map((b) => ({ ...b, country: 'SWE' })));
  const [events, setEvents] = React.useState(H.events);
  const [chat, setChat] = React.useState(H.chat);
  const [players, setPlayers] = React.useState(H.players);
  const [toasts, setToasts] = React.useState([]);
  const stageRef = React.useRef(null), hostRef = React.useRef(null), globeRef = React.useRef(null);

  const me = { ...players.find((p) => p.me), color: t.myColor };
  const allPlayers = players.map((p) => (p.me ? me : p));

  React.useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / HUD_W, window.innerHeight / HUD_H));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setSecs((s) => { if (s <= 1) { setDay((d) => d + 1); return H.TICK_SEC; } return s - 1; }), 1000);
    return () => clearInterval(id);
  }, []);

  const toast = (msg, kind) => {
    const id = Math.random();
    setToasts((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2600);
  };

  // Globe
  React.useEffect(() => {
    const g = new window.Globe(hostRef.current, { autoRotate: false });
    globeRef.current = g;
    g.camera.position.z = 2.6;
    g.load(D.GEO_URL).then(() => {
      const props = {}, feats = {};
      g.setSelectable(true);
      Object.keys(g.props).forEach((c) => { props[c] = g.props[c]; });
      window.__HUD_PROPS = props;
      fetch(D.GEO_URL).then((r) => r.json()).then((fc) => { fc.features.forEach((f) => { feats[f.properties.code] = f; }); setGeo({ props, feats }); });
      g.focus('SWE'); g._targetRotX = Math.min(g._targetRotX, 0.92);
    });
    return () => g.destroy();
  }, []);

  const cbs = React.useRef({});
  cbs.current = { setHover, setSelected };
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    g.onHover((c, p) => cbs.current.setHover(c ? { code: c, props: p } : null));
    g.onSelect((c) => cbs.current.setSelected(c));
  }, [geo]);

  const ownerOf = (code) => allPlayers.find((p) => p.lands.includes(code)) || null;

  // Lens colouring
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    const map = {};
    if (lens === 'political') {
      allPlayers.forEach((p) => p.lands.forEach((c) => { map[c] = p.color; }));
      if (t.scenario === 'attack') map.FIN = me.color;
    } else {
      const hex = { farmland: HUD_RES.food.hex, minerals: HUD_RES.minerals.hex, oil: HUD_RES.oil.hex }[lens];
      const lo = new THREE.Color('#1c2740'), hi = new THREE.Color(hex);
      Object.keys(geo.props).forEach((c) => { map[c] = '#' + lo.clone().lerp(hi, Math.pow(geo.props[c][lens] / 100, 0.8)).getHexString(); });
    }
    g.setOwners(map);
    g.setSelected(lens === 'political' ? selected : null);
  }, [geo, lens, selected, t.myColor, t.scenario, players]);

  // Keyboard: B / A / T / D
  React.useEffect(() => {
    const keys = { b: 'build', a: 'army', t: 'trade', d: 'diplomacy' };
    const f = (e) => { if (e.target.tagName === 'INPUT') return; const m = keys[e.key.toLowerCase()]; if (m) setMode(m); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  const onPointerMove = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale });
  };

  const onBuild = (type, afford) => {
    const B = D.BUILDINGS[type];
    if (!afford) return toast('Not enough resources.', 'err');
    setQueue((q) => [...q, { type, status: 'building', country: selected, started: day, complete_at: day + B.build_ticks }]);
    toast(B.name + ' started.', 'ok');
  };
  const onTrain = (u) => toast('Training 5 ' + H.UNITS[u].name.toLowerCase() + '.', 'ok');
  const onMove = (code, hostile) => {
    const name = geo && geo.props[code] ? geo.props[code].name : code;
    toast(hostile ? 'Forces marching on ' + name + '.' : 'Reinforcing ' + name + '.', 'ok');
    if (hostile) setEvents((ev) => [{ id: Math.random(), type: 'war', actor: 'You', text: 'sent forces toward ' + name, day }, ...ev]);
  };
  const onTrade = (tr, ok) => toast(ok ? 'Trade accepted.' : 'Offer declined.', ok ? 'ok' : 'default');
  const onDiplo = (p, to) => {
    setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, diplo: to } : x)));
    toast({ allied: 'Alliance proposed to ', war: 'War declared on ', truce: 'Truce offered to ', neutral: 'Alliance broken with ' }[to] + p.name + '.', to === 'war' ? 'err' : 'ok');
  };
  const onSend = (body, scope) => setChat((c) => [...c, { id: Math.random(), scope, pid: me.id, body }]);
  const onAlert = () => {
    if (t.scenario === 'attack') { setSelected('FIN'); setMode('army'); globeRef.current && globeRef.current.focus('FIN'); }
    else { setSelected('SWE'); setMode('build'); }
  };

  const props = geo && geo.props[selected];
  const shapeOf = (c) => (geo ? hudShape(geo.feats[c]) : null);
  const myShape = React.useMemo(() => shapeOf(me.country), [geo]);
  const selShape = React.useMemo(() => shapeOf(selected), [geo, selected]);
  const pending = H.trades.filter((x) => x.dir === 'in').length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#05080f', overflow: 'hidden' }}>
      <div ref={stageRef} onPointerMove={onPointerMove} style={{ position: 'absolute', left: '50%', top: '50%', width: HUD_W, height: HUD_H, transform: 'translate(-50%, -50%) scale(' + scale + ')', overflow: 'hidden', background: 'var(--grad-page), var(--bg-page)' }}>
        <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(6,10,20,.65) 0%, rgba(6,10,20,0) 22%, rgba(6,10,20,0) 72%, rgba(6,10,20,.7) 100%)' }} />

        <IdentityPlate me={me} countryName={geo ? geo.props[me.country].name : 'Sweden'} shape={myShape} sc={sc} territories={me.lands.length} solid={solid} />
        <WorldClock day={day} secsLeft={secs} tickSec={H.TICK_SEC} players={allPlayers} total={H.TOTAL} victory={H.VICTORY} solid={solid} />
        <Treasury sc={sc} solid={solid} />
        <AlertRibbon alert={sc.alert} day={day} onAction={onAlert} />
        <Standings players={allPlayers} total={H.TOTAL} selected={selected} onPick={(c) => { setSelected(c); globeRef.current && globeRef.current.focus(c); }} solid={solid} />
        {props ? <ContextPanel mode={mode} setMode={setMode} code={selected} props={props} shape={selShape} owner={ownerOf(selected)} me={me} players={allPlayers} sc={sc} day={day} queue={queue.filter((b) => b.country === selected)} onBuild={onBuild} onTrain={onTrain} onMove={onMove} onTrade={onTrade} onDiplo={onDiplo} solid={solid} /> : null}
        <Comms players={allPlayers} events={events} chat={chat} onSend={onSend} solid={solid} />
        <Hotbar mode={mode} setMode={setMode} counts={{ trade: pending, army: t.scenario === 'attack' ? '!' : 0 }} />
        <GlobeControls lens={lens} setLens={setLens} onHome={() => { setSelected(me.country); globeRef.current && globeRef.current.focus(me.country); }} onZoom={(dz) => { const g = globeRef.current; if (g) g.camera.position.z = Math.max(1.6, Math.min(5, g.camera.position.z + dz)); }} />
        <HoverTip hover={hover} pos={pos} owner={hover ? ownerOf(hover.code) : null} lens={lens} />

        <div style={{ position: 'absolute', top: sc.alert ? 262 : 186, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none', zIndex: 40 }}>
          {toasts.map((x) => <Toast key={x.id} kind={x.kind}>{x.msg}</Toast>)}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Match state" />
        <TweakRadio label="Scenario" value={t.scenario} options={[{ value: 'calm', label: 'Calm' }, { value: 'attack', label: 'Invaded' }, { value: 'starving', label: 'Starving' }]} onChange={(v) => setTweak('scenario', v)} />
        <TweakSection label="HUD" />
        <TweakRadio label="Panels" value={t.panels} options={[{ value: 'frosted', label: 'Frosted' }, { value: 'solid', label: 'Solid' }]} onChange={(v) => setTweak('panels', v)} />
        <TweakColor label="Your slot colour" value={t.myColor} options={['#42d4f4', '#bfef45', '#f032e6', '#dcbeff']} onChange={(v) => setTweak('myColor', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MatchHud />);
