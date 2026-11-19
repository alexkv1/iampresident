// Mode panes for the context panel: Build / Army / Trade / Diplomacy.
const BUILD_ORDER = ['farm', 'mine', 'oil_rig', 'power_plant', 'factory', 'lab', 'bank', 'housing'];

function buildYield(type, props) {
  const B = window.IAP_DATA.BUILDINGS[type];
  if (type === 'housing') return [['research', null, '+40M pop cap']];
  const out = [];
  Object.keys(B.produces || {}).forEach((k) => out.push([k, Math.round(B.produces[k] * (B.scale ? props[B.scale] / 50 : 1))]));
  Object.keys(B.consumes || {}).forEach((k) => out.push([k, -B.consumes[k]]));
  return out;
}

function SectionHead({ children, right }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' }}><Eyebrow>{children}</Eyebrow>{right}</div>;
}

function BuildPane({ props, sc, day, queue, onBuild }) {
  const D = window.IAP_DATA;
  const building = queue.filter((b) => b.status === 'building');
  const active = queue.filter((b) => b.status === 'active');
  const counts = {};
  active.forEach((b) => { counts[b.type] = (counts[b.type] || 0) + 1; });
  return (
    <div>
      {building.length ? (
        <div style={{ marginBottom: 14 }}>
          <SectionHead>Under construction</SectionHead>
          {building.map((b, i) => {
            const B = D.BUILDINGS[b.type];
            const pct = Math.min(1, (day - b.started) / (b.complete_at - b.started));
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <Tile icon={B.icon} tone={B.tone} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: '600 13px/1 var(--font-body)', color: '#fff', marginBottom: 6 }}><span>{B.name}</span><span style={{ color: 'var(--text-muted)', fontWeight: 500 }}><i className="ph-fill ph-hourglass" /> Day {b.complete_at}</span></div>
                  <Meter value={pct} max={1} color="var(--gold-400)" height={6} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <SectionHead>Active here</SectionHead>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {Object.keys(counts).map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px 4px 4px', borderRadius: 999, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)', font: '600 12px/1 var(--font-body)', color: '#fff' }}>
            <Tile icon={D.BUILDINGS[t].icon} tone={D.BUILDINGS[t].tone} size={20} iconSize={12} />{D.BUILDINGS[t].name}<span style={{ color: 'var(--text-muted)' }}>×{counts[t]}</span>
          </span>
        ))}
      </div>
      <SectionHead right={<span style={{ font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>output for this land</span>}>Construct</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {BUILD_ORDER.map((t) => <BuildTile key={t} type={t} props={props} sc={sc} onBuild={onBuild} />)}
      </div>
    </div>
  );
}

function BuildTile({ type, props, sc, onBuild }) {
  const B = window.IAP_DATA.BUILDINGS[type];
  const [hover, setHover] = React.useState(false);
  const afford = Object.keys(B.cost).every((k) => (sc.res[k] || 0) >= B.cost[k]);
  const y = buildYield(type, props);
  return (
    <div onClick={() => onBuild(type, afford)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} title={B.desc}
      style={{ padding: 9, borderRadius: 10, cursor: afford ? 'pointer' : 'not-allowed', opacity: afford ? 1 : 0.5, background: 'var(--grad-navy)', border: '1px solid ' + (hover && afford ? 'var(--teal-400)' : 'var(--navy-600)'), boxShadow: '0 3px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)' + (hover && afford ? ', var(--glow-teal)' : ''), transform: hover && afford ? 'translateY(-1px)' : 'none', transition: 'transform 80ms ease, box-shadow 150ms ease, border-color 150ms ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tile icon={B.icon} tone={B.tone} size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 13px/1.1 var(--font-body)', color: '#fff', whiteSpace: 'nowrap' }}>{B.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, font: '700 12px/1 var(--font-num)', fontVariantNumeric: 'tabular-nums' }}>
            {y.map(([k, v, txt]) => <span key={k + v} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: txt ? 'var(--sky-300)' : v >= 0 ? HUD_RES[k].color : 'var(--red-300)' }}>{txt || <React.Fragment>{(v >= 0 ? '+' : '−') + Math.abs(v)}<i className={'ph-fill ph-' + HUD_RES[k].icon} style={{ fontSize: 11 }} /></React.Fragment>}</span>)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Cost cost={B.cost} have={sc.res} size={11} />
        <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)' }}><i className="ph-fill ph-hourglass" /> {B.build_ticks}d</span>
      </div>
    </div>
  );
}

function ArmyPane({ code, props, owner, sc, onTrain, onMove }) {
  const H = window.HUD_DATA;
  const { Button } = window.IAP_DS;
  const mine = owner && owner.me;
  const forces = mine && code === 'SWE' ? H.armiesHere : [];
  const strength = H.armiesHere.reduce((a, f) => a + f.count * H.UNITS[f.type].attack, 0);
  if (!mine) {
    const def = owner ? 4 + 18 : 8;
    return (
      <div>
        <SectionHead>Attack {props.name}</SectionHead>
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(230,25,75,.08)', boxShadow: 'inset 0 0 0 1px var(--red-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}><Eyebrow>Your strike force</Eyebrow><div style={{ font: 'italic 900 40px/1 var(--font-display)', color: 'var(--teal-300)', marginTop: 4 }}>{strength}</div></div>
            <span style={{ font: 'italic 900 22px/1 var(--font-display)', color: 'var(--text-muted)' }}>VS</span>
            <div style={{ textAlign: 'center' }}><Eyebrow>Defence</Eyebrow><div style={{ font: 'italic 900 40px/1 var(--font-display)', color: 'var(--red-300)', marginTop: 4 }}>{def}</div></div>
          </div>
          <div style={{ textAlign: 'center', margin: '8px 0 12px', font: '500 12px/1.3 var(--font-body)', color: strength > def ? 'var(--green-300)' : 'var(--red-300)' }}>{strength > def ? 'Attacker wins if strength is higher. Expect ~' + Math.round(Math.min(0.9, def / strength) * 100) + '% losses.' : 'Too strong. Train more units first.'}</div>
          <Button variant="danger" icon="sword" block onClick={() => onMove(code, true)}>Attack from Sweden · 2 days</Button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <SectionHead right={<span style={{ font: 'italic 800 14px/1 var(--font-display)', color: 'var(--teal-300)', textTransform: 'uppercase' }}>Strength {forces.length ? strength : 0}</span>}>Forces here</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
        {Object.keys(H.UNITS).map((u) => {
          const f = forces.find((x) => x.type === u);
          return (
            <div key={u} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)', opacity: f ? 1 : 0.5 }}>
              <i className={'ph-fill ph-' + H.UNITS[u].icon} style={{ fontSize: 20, color: f ? '#fff' : 'var(--navy-400)' }} />
              <div style={{ font: 'italic 900 20px/1 var(--font-display)', color: '#fff', marginTop: 4 }}>{f ? f.count : 0}</div>
              <div style={{ font: '500 10px/1 var(--font-body)', color: 'var(--text-muted)', marginTop: 2 }}>{H.UNITS[u].name}</div>
            </div>
          );
        })}
      </div>
      <SectionHead>Train</SectionHead>
      {Object.keys(H.UNITS).map((u) => {
        const U = H.UNITS[u];
        const afford = Object.keys(U.cost).every((k) => (sc.res[k] || 0) >= U.cost[k] * 5);
        return (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <Tile icon={U.icon} tone="var(--navy-500)" size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--font-body)', color: '#fff' }}>{U.name}<span style={{ font: 'italic 800 12px/1 var(--font-display)', color: 'var(--red-300)' }}>ATK {U.attack}</span></div>
              <div style={{ marginTop: 4 }}><Cost cost={U.cost} have={sc.res} size={11} /></div>
            </div>
            <Button size="sm" variant={afford ? 'primary' : 'default'} disabled={!afford} onClick={() => onTrain(u)}>×5</Button>
          </div>
        );
      })}
      <SectionHead><span style={{ display: 'block', marginTop: 10 }}>Move forces</span></SectionHead>
      {H.moveTargets.map((t) => {
        const name = (window.__HUD_PROPS[t.code] || {}).name || t.code;
        const hostile = t.owner == null;
        return (
          <div key={t.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.1 var(--font-body)', color: '#fff' }}>{name}</div>
              <div style={{ font: '400 11px/1.3 var(--font-body)', color: hostile ? 'var(--red-300)' : 'var(--teal-300)' }}>{hostile ? 'Neutral · ' + strength + ' vs ' + t.garrison : 'Yours · reinforce'} · {t.eta}d</div>
            </div>
            <Button size="sm" variant={hostile ? 'danger' : 'ghost'} onClick={() => onMove(t.code, hostile)}>{hostile ? 'Attack' : 'Move'}</Button>
          </div>
        );
      })}
    </div>
  );
}

function ResLine({ res }) {
  return (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      {Object.keys(res).map((k) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'italic 800 18px/1 var(--font-display)', color: '#fff' }}><i className={'ph-fill ph-' + HUD_RES[k].icon} style={{ color: HUD_RES[k].color, fontSize: 16 }} />{res[k]}</span>)}
    </span>
  );
}

function TradePane({ players, sc, onTrade }) {
  const H = window.HUD_DATA;
  const { Button, Pill } = window.IAP_DS;
  const [done, setDone] = React.useState({});
  const pl = (id) => players.find((p) => p.id === id);
  const incoming = H.trades.filter((t) => t.dir === 'in' && !done[t.id]);
  const outgoing = H.trades.filter((t) => t.dir === 'out' && !done[t.id]);
  const act = (t, ok) => { setDone({ ...done, [t.id]: true }); onTrade(t, ok); };
  return (
    <div>
      <SectionHead right={<Button size="sm" variant="gold" icon="plus">New offer</Button>}>Incoming offers</SectionHead>
      {!incoming.length ? <div style={{ font: '400 13px/1.4 var(--font-body)', color: 'var(--text-muted)', padding: '6px 0 12px' }}>No offers on the table.</div> : null}
      {incoming.map((t) => {
        const p = pl(t.from);
        return (
          <div key={t.id} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: 'var(--grad-navy)', border: '1px solid var(--navy-600)', boxShadow: '0 3px 0 var(--navy-950)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--font-body)', color: '#fff' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />{p.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, margin: '10px 0' }}>
              <div><Eyebrow style={{ marginBottom: 5 }}>You get</Eyebrow><ResLine res={t.give} /></div>
              <i className="ph-bold ph-arrows-left-right" style={{ color: 'var(--text-muted)', fontSize: 18 }} />
              <div><Eyebrow style={{ marginBottom: 5 }}>You give</Eyebrow><ResLine res={t.receive} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="primary" icon="check" style={{ flex: 1 }} onClick={() => act(t, true)}>Accept</Button>
              <Button size="sm" variant="ghost" style={{ flex: 1 }} onClick={() => act(t, false)}>Decline</Button>
            </div>
          </div>
        );
      })}
      <SectionHead><span style={{ display: 'block', marginTop: 6 }}>Your offers</span></SectionHead>
      {outgoing.map((t) => {
        const p = pl(t.to);
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, background: 'var(--navy-850)', boxShadow: 'var(--shadow-inset-well)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 12px/1 var(--font-body)', color: '#fff', marginBottom: 6 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />To {p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ResLine res={t.give} /><i className="ph-bold ph-arrow-right" style={{ color: 'var(--text-muted)' }} /><ResLine res={t.receive} /></div>
            </div>
            <Pill icon="hourglass">Pending</Pill>
          </div>
        );
      })}
    </div>
  );
}

function DiplomacyPane({ players, onDiplo }) {
  const { Button, Badge } = window.IAP_DS;
  const ACTIONS = { neutral: [['allied', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']], allied: [['neutral', 'Break alliance', 'ghost']], war: [['truce', 'Offer truce', 'default']], truce: [['allied', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']] };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.filter((p) => !p.me).map((p) => {
        const d = DIPLO[p.diplo || 'neutral'];
        return (
          <div key={p.id} style={{ padding: 12, borderRadius: 12, background: 'var(--grad-navy)', border: '1px solid var(--navy-600)', boxShadow: '0 3px 0 var(--navy-950)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 32, borderRadius: 3, background: p.color, transform: 'skewX(var(--skew))' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 14px/1.2 var(--font-body)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>{p.title} · {p.lands.length} lands{p.ai ? ' · AI' : ''}</div>
              </div>
              <Badge kind={d.kind} icon={d.icon}>{d.label}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {ACTIONS[p.diplo || 'neutral'].map(([to, label, v]) => <Button key={to} size="sm" variant={v} style={{ flex: 1 }} onClick={() => onDiplo(p, to)}>{label}</Button>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { BuildPane, ArmyPane, TradePane, DiplomacyPane });
