// Troops on the globe: army markers, march routes, target reticles, battle bursts, and the Army pane.
const ARMY_UNIT_ORDER = ['air', 'armor', 'artillery', 'navy', 'infantry'];
function armyStrength(u) { const U = window.HUD_DATA.UNITS; return Object.keys(u).reduce((s, k) => s + u[k] * U[k].attack, 0); }
function armyCount(u) { return Object.values(u).reduce((a, b) => a + b, 0); }
function armyTop(u) { return ARMY_UNIT_ORDER.find((k) => u[k] > 0) || 'infantry'; }
function armyList(u) { const U = window.HUD_DATA.UNITS; return ARMY_UNIT_ORDER.filter((k) => u[k] > 0).map((k) => u[k] + ' ' + U[k].name.toLowerCase()).join(', '); }
const ROUTE_COLOR = { land: '#7fe6dc', sea: '#7cc4ff', air: '#c9adf2' };

// One marker: a chunky plate in the owner's colour, pinned to a point on the globe.
function ArmyMarker({ a, player, isMe, atWar, day, onPick }) {
  const U = window.HUD_DATA.UNITS;
  const top = armyTop(a.units), moving = !!a.route;
  const name = isMe ? 'Your army' : player.name + '’s army';
  const where = (window.__HUD_PROPS[moving ? a.to : a.at] || {}).name;
  const tip = { title: name, icon: U[top].icon, tone: player.color, body: HUD_TIPS.marker.body, stats: ARMY_UNIT_ORDER.filter((k) => a.units[k] > 0).map((k) => ({ label: U[k].name, value: a.units[k], icon: U[k].icon })).concat([{ label: 'Strength', value: armyStrength(a.units), color: 'var(--teal-300)' }, moving ? { label: 'Marching to', value: where + ' · Day ' + a.arriveDay, color: atWar ? 'var(--red-300)' : 'var(--sky-300)' } : { label: 'Stationed in', value: where }]) };
  return (
    <Tip tip={tip} place="top" onClick={(e) => { e.stopPropagation(); onPick(moving ? a.to : a.at); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      {moving ? <div style={{ marginBottom: 3, padding: '2px 6px', borderRadius: 5, background: 'rgba(6,10,20,.85)', font: 'italic 800 11px/1 var(--font-display)', textTransform: 'uppercase', color: atWar ? 'var(--red-300)' : '#fff', whiteSpace: 'nowrap' }}>Day {a.arriveDay}</div> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px 0 3px', borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(0,0,0,.14)), ' + player.color, border: '2px solid ' + (isMe ? '#fff' : 'rgba(6,10,20,.85)'), boxShadow: '0 3px 0 rgba(0,0,0,.5), 0 6px 14px rgba(0,0,0,.5)' + (atWar ? ', 0 0 0 3px rgba(230,25,75,.6)' : ''), animation: atWar && moving ? 'iap-pulse 1s ease-in-out infinite' : 'none' }}>
        <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(6,10,20,.4)' }}><i className={'ph-fill ph-' + U[top].icon} style={{ fontSize: 12, color: '#fff' }} /></span>
        <span style={{ font: 'italic 900 16px/1 var(--font-display)', color: '#fff', textShadow: '0 1px 0 rgba(0,0,0,.6), 0 0 4px rgba(0,0,0,.5)' }}>{armyCount(a.units)}</span>
        {moving ? <i className="ph-fill ph-caret-double-right" style={{ fontSize: 11, color: '#fff' }} /> : null}
      </div>
      <div style={{ width: 2, height: 7, background: isMe ? '#fff' : 'rgba(6,10,20,.85)' }} />
      <div style={{ width: 10, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,.55)', boxShadow: '0 0 4px rgba(0,0,0,.6)' }} />
    </Tip>
  );
}

// Positions every marker each frame by projecting its globe point; fades markers on the far side.
const BURST_STYLE = {
  win: { glow: 'rgba(255,216,100,.9)', icon: 'sword', size: 80 },
  lose: { glow: 'rgba(124,196,255,.9)', icon: 'shield', size: 80 },
  strike: { glow: 'rgba(255,159,67,.95)', icon: 'fire', size: 90 },
  nuke: { glow: 'rgba(255,214,120,1)', icon: 'radioactive', size: 220 },
};
const SHOT_ICON = { artillery: 'target', air: 'airplane-tilt', missile: 'rocket', nuke: 'radioactive' };

function MarkerLayer({ globeRef, armies, players, me, warIds, day, reticles, bursts, shots = [], onPick }) {
  const els = React.useRef({});
  const items = React.useRef([]);
  items.current = armies.map((a) => ({ id: a.id, a })).concat(reticles.map((r) => ({ id: 'ret-' + r.code, code: r.code }))).concat(bursts.map((b) => ({ id: 'burst-' + b.id, code: b.code }))).concat(shots.map((s) => ({ id: 'shot-' + s.id, a: s })));
  React.useEffect(() => {
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const g = globeRef.current;
      if (!g || !window.HUD_GEO.centroid('SWE')) return;
      const now = performance.now();
      for (const it of items.current) {
        const el = els.current[it.id];
        if (!el) continue;
        let p;
        if (it.a && it.a.route) { const f = (now - it.a.start) / it.a.dur; p = window.HUD_GEO.pointAt(it.a.route, it.a.ease ? 1 - Math.pow(1 - Math.min(1, f), 2) : f); }
        else { const c = window.HUD_GEO.centroid(it.a ? it.a.at : it.code); if (!c) continue; p = g.lonLatVec(c[0], c[1], 1.012); }
        const s = g.projectLocal(p);
        el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
        el.style.opacity = s.vis;
        el.style.pointerEvents = s.vis > 0.6 ? 'auto' : 'none';
        el.style.zIndex = Math.round(s.y);
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  const pl = (id) => players.find((p) => p.id === id);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, isolation: 'isolate' }}>
      {reticles.map((r) => (
        <div key={'ret-' + r.code} ref={(n) => { els.current['ret-' + r.code] = n; }} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%', border: '2px solid ' + r.color, boxShadow: '0 0 12px ' + r.color, animation: 'iap-reticle 1.4s ease-out infinite' }} />
          <i className="ph-bold ph-crosshair" style={{ position: 'absolute', left: -11, top: -11, fontSize: 22, color: r.color, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }} />
        </div>
      ))}
      {armies.map((a) => (
        <div key={a.id} ref={(n) => { els.current[a.id] = n; }} style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
          <div style={{ transform: 'translate(-50%, -100%)' }}>
            <ArmyMarker a={a} player={pl(a.owner)} isMe={a.owner === me.id} atWar={warIds.has(a.owner)} day={day} onPick={onPick} />
          </div>
        </div>
      ))}
      {shots.map((s) => (
        <div key={'shot-' + s.id} ref={(n) => { els.current['shot-' + s.id] = n; }} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: -15, top: -15, width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, rgba(255,179,107,.95), rgba(255,120,40,.35) 60%, transparent 72%)' }}>
            <i className={'ph-fill ph-' + SHOT_ICON[s.kind]} style={{ fontSize: 16, color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.7))' }} />
          </div>
        </div>
      ))}
      {bursts.map((b) => {
        const k = BURST_STYLE[b.kind || (b.win ? 'win' : 'lose')], h = k.size / 2;
        return (
          <div key={'burst-' + b.id} ref={(n) => { els.current['burst-' + b.id] = n; }} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: -h, top: -h, width: k.size, height: k.size, borderRadius: '50%', background: 'radial-gradient(circle, ' + k.glow + ' 0%, rgba(255,255,255,0) 70%)', animation: 'iap-burst ' + (b.kind === 'nuke' ? '2.4s' : '1.4s') + ' ease-out forwards' }} />
            <div style={{ position: 'absolute', left: -20, top: -20, width: 40, height: 40, display: 'grid', placeItems: 'center', animation: 'iap-burst-icon 1.4s var(--ease-pop) forwards' }}>
              <i className={'ph-fill ph-' + k.icon} style={{ fontSize: 30, color: '#fff', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.5))' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Army pane ------------------------------------------------------------
function FogNote({ name }) {
  return (
    <Tip tip={HUD_TIPS.fog} place="left" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 8px, transparent 8px 16px), rgba(6,10,20,.5)', boxShadow: 'inset 0 0 0 1px var(--navy-600)', cursor: 'help' }}>
      <i className="ph-fill ph-eye-slash" style={{ fontSize: 22, color: 'var(--navy-300)' }} />
      <div>
        <div style={{ font: 'italic 800 15px/1 var(--font-display)', textTransform: 'uppercase', color: '#fff' }}>Hidden by fog of war</div>
        <div style={{ marginTop: 3, font: '400 12px/1.35 var(--font-body)', color: 'var(--text-muted)' }}>Move troops next to {name} to scout its defence.</div>
      </div>
    </Tip>
  );
}

function RouteRow({ opt, onSend, onPreview, def, friendly }) {
  const { Button } = window.IAP_DS;
  const t = HUD_TIPS.route[opt.kind];
  const icon = { land: 'person-simple-run', sea: 'boat', air: 'airplane-tilt' }[opt.kind];
  const win = def == null ? null : opt.strength > def;
  return (
    <div onMouseEnter={() => opt.ok && onPreview(opt)} onMouseLeave={() => onPreview(null)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)', opacity: opt.ok ? 1 : 0.5 }}>
      <Tip tip={t} place="left" style={{ cursor: 'help' }}><Tile icon={icon} tone={ROUTE_COLOR[opt.kind] === '#7fe6dc' ? 'var(--teal-600)' : opt.kind === 'sea' ? 'var(--sky-500)' : '#8a63c4'} size={30} /></Tip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 13px/1.15 var(--font-body)', color: '#fff' }}>{t.title}{opt.ok ? ' · ' + opt.days + (opt.days === 1 ? ' day' : ' days') : ''}</div>
        {opt.ok ? <div style={{ marginTop: 3, font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>{'from ' + opt.fromName + (opt.via.length ? ' via ' + opt.via.join(', ') : '') + ' · ' + Math.round(opt.km).toLocaleString('sv-SE') + ' km'}</div>
          : opt.blockers ? <Tip tip={HUD_TIPS.blocked} place="left" style={{ marginTop: 3, font: '400 11px/1.3 var(--font-body)', color: 'var(--red-300)', cursor: 'help' }}><i className="ph-fill ph-prohibit" /> Blocked by {opt.blockers.join(', ')}</Tip>
          : <div style={{ marginTop: 3, font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>{opt.reason}</div>}
      </div>
      {opt.ok ? (
        <Tip tip={HUD_TIPS.odds} place="left" style={{ textAlign: 'right', cursor: 'help' }}>
          <div style={{ font: 'italic 800 16px/1 var(--font-display)', color: '#fff' }}>{opt.strength}</div>
          {opt.odds != null ? <div style={{ marginTop: 2, font: '700 11px/1 var(--font-body)', color: opt.odds >= 0.65 ? 'var(--green-300)' : opt.odds >= 0.35 ? 'var(--gold-300)' : 'var(--red-300)' }}>{Math.round(opt.odds * 100)}%</div> : null}
        </Tip>
      ) : null}
      <Button size="sm" variant={!opt.ok ? 'default' : friendly ? 'primary' : 'danger'} disabled={!opt.ok} onClick={() => onSend(opt)}>{friendly ? 'Move' : 'Attack'}</Button>
    </div>
  );
}

function StrikeRow({ s, onStrike }) {
  const { Button } = window.IAP_DS;
  const t = HUD_TIPS.strike[s.kind], nuke = s.kind === 'nuke';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)', opacity: s.ok ? 1 : 0.55 }}>
      <Tip tip={t} place="left" style={{ cursor: 'help' }}><Tile icon={t.icon} tone={nuke ? 'linear-gradient(180deg,#ff9f43,#b4520c)' : t.tone} size={30} /></Tip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 13px/1.15 var(--font-body)', color: nuke ? 'var(--gold-300)' : '#fff' }}>{t.title}</div>
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, font: '400 11px/1.3 var(--font-body)', color: s.ok ? 'var(--text-muted)' : s.locked ? 'var(--navy-300)' : 'var(--red-300)' }}>
          {s.locked ? <i className="ph-fill ph-lock" /> : null}{s.ok ? s.detail : s.reason}
        </div>
      </div>
      {s.ok ? <span style={{ font: 'italic 800 16px/1 var(--font-display)', color: 'var(--gold-300)' }}>−{s.damage}</span> : null}
      <Button size="sm" variant={s.ok ? (nuke ? 'danger' : 'gold') : 'default'} disabled={!s.ok} icon={s.ok ? 'fire' : undefined} onClick={() => onStrike(s)}>Strike</Button>
    </div>
  );
}

function ArmyPane({ code, props, owner, sc, onTrain, army }) {
  const H = window.HUD_DATA;
  const { Button } = window.IAP_DS;
  const { mine, allied, stacks, incoming, neighbors, plan, defence, fogged, enemyHere, onSend, onPreview, onStrike, techDone } = army;
  if (allied) {
    return (
      <div>
        <SectionHead>Reinforce {props.name}</SectionHead>
        <div style={{ marginBottom: 12, font: '400 12px/1.45 var(--font-body)', color: 'var(--text-muted)' }}>Allied land. Your troops can pass through it and help defend it; they never fight your ally.</div>
        <SectionHead right={<span style={{ font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>hover to preview route</span>}>Routes</SectionHead>
        {plan.invade.map((o) => <RouteRow key={o.kind} opt={o} def={null} friendly onSend={onSend} onPreview={onPreview} />)}
      </div>
    );
  }
  if (!mine) {
    const best = plan.invade.filter((o) => o.ok).sort((x, y) => y.strength - x.strength)[0];
    return (
      <div>
        <SectionHead>Attack {props.name}</SectionHead>
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(230,25,75,.08)', boxShadow: 'inset 0 0 0 1px var(--red-800)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}><Eyebrow>Your attack</Eyebrow><div style={{ font: 'italic 900 40px/1 var(--font-display)', color: 'var(--teal-300)', marginTop: 4 }}>{best ? best.strength : 0}</div></div>
            <span style={{ font: 'italic 900 22px/1 var(--font-display)', color: 'var(--text-muted)' }}>VS</span>
            <div style={{ textAlign: 'center' }}><Eyebrow>Defence</Eyebrow>
              {fogged ? <Tip tip={HUD_TIPS.fog} place="left" style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', font: 'italic 900 40px/1 var(--font-display)', color: 'var(--navy-300)', marginTop: 4 }}>?<i className="ph-fill ph-eye-slash" style={{ fontSize: 18 }} /></Tip>
                : <div style={{ font: 'italic 900 40px/1 var(--font-display)', color: 'var(--red-300)', marginTop: 4 }}>{defence}</div>}
            </div>
          </div>
          {!fogged && best && best.odds != null ? <Tip tip={HUD_TIPS.odds} place="left" style={{ cursor: 'help', textAlign: 'center', marginTop: 8, font: '600 12px/1.3 var(--font-body)', color: best.odds >= 0.65 ? 'var(--green-300)' : best.odds >= 0.35 ? 'var(--gold-300)' : 'var(--red-300)' }}>Win chance {Math.round(best.odds * 100)}% · defenders ×1.5{army.terrain !== 'plains' ? ' · ' + army.terrain + ' ×' + window.HUD_GEO.terrainMult(code) : ''}</Tip> : null}
        </div>
        {fogged ? <div style={{ marginBottom: 12 }}><FogNote name={props.name} /></div> : enemyHere.length ? (
          <div style={{ marginBottom: 12, font: '400 12px/1.4 var(--font-body)', color: 'var(--text-muted)' }}>Spotted here: <b style={{ color: '#fff' }}>{enemyHere.map((s) => armyList(s.units)).join(' + ')}</b></div>
        ) : null}
        <SectionHead right={<span style={{ font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>hover to preview route</span>}>Invade</SectionHead>
        {plan.invade.map((o) => <RouteRow key={o.kind} opt={o} def={fogged ? null : defence} onSend={onSend} onPreview={onPreview} />)}
        <SectionHead right={<Tip tip={HUD_TIPS.strikeRule} place="left" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)', cursor: 'help' }}><i className="ph-fill ph-info" />can’t capture land</Tip>}><span style={{ display: 'block', marginTop: 12 }}>Strike from range</span></SectionHead>
        {plan.strike.map((s) => <StrikeRow key={s.kind} s={s} onStrike={onStrike} />)}
      </div>
    );
  }
  const here = stacks[0];
  const strength = here ? armyStrength(here.units) : 0;
  return (
    <div>
      {incoming.length ? (
        <div style={{ padding: 10, borderRadius: 10, marginBottom: 12, background: 'rgba(230,25,75,.12)', boxShadow: 'inset 0 0 0 1px var(--red-800)' }}>
          {incoming.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ph-fill ph-warning" style={{ fontSize: 18, color: 'var(--red-300)', animation: 'iap-pulse 1s ease-in-out infinite' }} />
              <div style={{ flex: 1, font: '500 12px/1.35 var(--font-body)', color: '#fff' }}><b>{m.ownerName}</b> · {armyList(m.units)} · arrives Day {m.arriveDay}</div>
              <span style={{ font: 'italic 800 15px/1 var(--font-display)', color: armyStrength(m.units) >= defence ? 'var(--red-300)' : 'var(--green-300)' }}>{armyStrength(m.units)} vs {defence}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>Your defence here is {defence} (garrison 4 + troops). Reinforce from a neighbouring land.</div>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Tip tip={{ ...HUD_TIPS.manpower, stats: [{ label: 'In service', value: army.manpower.used }, { label: 'Limit (1% of pop)', value: army.manpower.limit }] }} place="left" style={{ cursor: 'help', padding: 8, borderRadius: 10, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}><Eyebrow>Manpower</Eyebrow><span style={{ font: 'italic 800 14px/1 var(--font-display)', color: '#fff' }}>{army.manpower.used}/{army.manpower.limit}</span></div>
          <Meter value={army.manpower.used} max={army.manpower.limit} color={army.manpower.used / army.manpower.limit > 0.9 ? 'var(--red-500)' : 'var(--sky-400)'} height={5} />
        </Tip>
        <Tip tip={{ ...HUD_TIPS.upkeep, stats: Object.keys(army.upkeep).map((r) => ({ label: HUD_RES[r].label, value: '\u2212' + army.upkeep[r] + ' / day', icon: HUD_RES[r].icon, color: HUD_RES[r].color })) }} place="left" style={{ cursor: 'help', padding: 8, borderRadius: 10, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)' }}>
          <Eyebrow style={{ marginBottom: 5 }}>Upkeep / day</Eyebrow>
          <div style={{ display: 'flex', gap: 7, font: '700 12px/1 var(--font-num)', color: 'var(--red-300)' }}>{Object.keys(army.upkeep).map((r) => <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><i className={'ph-fill ph-' + HUD_RES[r].icon} style={{ color: HUD_RES[r].color, fontSize: 11 }} />{army.upkeep[r]}</span>)}</div>
        </Tip>
      </div>
      <SectionHead right={<Tip tip={HUD_TIPS.strength} place="left" style={{ font: 'italic 800 14px/1 var(--font-display)', color: 'var(--teal-300)', textTransform: 'uppercase', cursor: 'help' }}>Strength {strength}</Tip>}>Forces here</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, marginBottom: 14 }}>
        {Object.keys(H.UNITS).map((u) => {
          const n = here ? here.units[u] || 0 : 0;
          return (
            <Tip key={u} place="left" tip={{ title: H.UNITS[u].name, icon: H.UNITS[u].icon, tone: 'var(--navy-500)', body: H.UNITS_TIPS[u], stats: [{ label: 'Attack', value: H.UNITS[u].attack, color: 'var(--red-300)' }, { label: 'Here', value: n + ' units' }, { label: 'Strength', value: n * H.UNITS[u].attack, color: 'var(--teal-300)' }] }} style={{ cursor: 'help', textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)', opacity: n ? 1 : 0.5 }}>
              <i className={'ph-fill ph-' + H.UNITS[u].icon} style={{ fontSize: 20, color: n ? '#fff' : 'var(--navy-400)' }} />
              <div style={{ font: 'italic 900 20px/1 var(--font-display)', color: '#fff', marginTop: 4 }}>{n}</div>
              <div style={{ font: '500 10px/1 var(--font-body)', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>{H.UNITS[u].name.replace('Air Force', 'Air')}</div>
            </Tip>
          );
        })}
      </div>
      <SectionHead right={<span style={{ font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>{army.training.length}/{army.slots} slots busy · batches of 5</span>}>Train</SectionHead>
      {army.training.map((x) => (
        <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 6, borderRadius: 8, background: 'rgba(63,162,255,.1)', boxShadow: 'inset 0 0 0 1px var(--sky-800)', font: '500 12px/1 var(--font-body)', color: '#fff' }}>
          <i className={'ph-fill ph-' + H.UNITS[x.u].icon} style={{ fontSize: 14 }} />5 {H.UNITS[x.u].name.toLowerCase()}<span style={{ flex: 1 }} /><span style={{ color: 'var(--sky-300)', animation: 'iap-pulse 1.6s ease-in-out infinite' }}><i className="ph-fill ph-hourglass" /> Day {x.ready}</span>
        </div>
      ))}
      {Object.keys(H.UNITS).map((u) => {
        const U = H.UNITS[u];
        const afford = Object.keys(U.cost).every((k) => (sc.res[k] || 0) >= U.cost[k] * 5);
        const locked = U.tech && !techDone.has(U.tech);
        return (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)', opacity: locked ? 0.55 : 1 }}>
            <Tile icon={U.icon} tone="var(--navy-500)" size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--font-body)', color: '#fff' }}>{U.name}<span style={{ font: 'italic 800 12px/1 var(--font-display)', color: 'var(--red-300)' }}>{U.attack ? 'ATK ' + U.attack : U.capacity ? 'CARRIES ' + U.capacity : 'STRIKE ' + U.strike}</span><span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)' }}><i className="ph-fill ph-hourglass" /> {U.build_ticks}d</span></div>
              <div style={{ marginTop: 4 }}>{locked ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 11px/1 var(--font-body)', color: 'var(--navy-300)' }}><i className="ph-fill ph-lock" />Research {U.name} first</span> : <Cost cost={U.cost} have={sc.res} size={11} />}</div>
            </div>
            <Button size="sm" variant={afford && !locked ? 'primary' : 'default'} disabled={!afford || locked} onClick={() => onTrain(u)}>×5</Button>
          </div>
        );
      })}
      <SectionHead><span style={{ display: 'block', marginTop: 10 }}>Send forces</span></SectionHead>
      {neighbors.map((n) => (
        <div key={n.code} onMouseEnter={() => here && onPreview({ kind: 'land', codes: [code, n.code] })} onMouseLeave={() => onPreview(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1.1 var(--font-body)', color: '#fff' }}>{n.ownerColor ? <span style={{ width: 8, height: 8, borderRadius: 2, background: n.ownerColor }} /> : null}{n.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, font: '400 11px/1.3 var(--font-body)', color: n.friendly ? 'var(--teal-300)' : 'var(--red-300)' }}>
              {n.friendly ? (n.mine ? 'Yours' : 'Allied') + ' · reinforce' : (n.ownerName || 'Neutral') + ' · ' + strength + ' vs '}
              {!n.friendly ? (n.def == null ? <Tip tip={HUD_TIPS.fog} place="left" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'help' }}>?<i className="ph-fill ph-eye-slash" /></Tip> : n.def) : null}
              <span style={{ color: 'var(--text-muted)' }}>· {n.days} {n.days === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          {n.blocked ? <Tip tip={{ title: 'Can’t attack', icon: 'prohibit', tone: 'var(--navy-500)', body: n.blocked }} place="left" style={{ cursor: 'help', font: '500 11px/1 var(--font-body)', color: 'var(--navy-300)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><i className="ph-fill ph-prohibit" />{n.blocked.indexOf('Truce') === 0 ? 'Truce' : n.blocked.indexOf('access') >= 0 ? 'No access' : 'Not at war'}</Tip>
            : <Button size="sm" variant={n.friendly ? 'ghost' : 'danger'} disabled={!here} onClick={() => onSend({ kind: 'land', armyId: here.id, codes: [code, n.code], days: n.days })}>{n.friendly ? 'Move' : 'Attack'}</Button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { MarkerLayer, ArmyPane, armyStrength, armyCount, armyList, ROUTE_COLOR });
