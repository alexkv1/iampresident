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
  const tip = { title: B.name, icon: B.icon, tone: B.tone, body: B.desc, stats: [
    { label: 'Output here', value: y.map(([k, v, txt]) => txt || ((v >= 0 ? '+' : '\u2212') + Math.abs(v) + ' ' + HUD_RES[k].label.toLowerCase())).join(', ') },
    { label: 'Energy use', value: B.needs_energy ? B.needs_energy + ' / day' : 'none', color: 'var(--res-energy)', icon: 'lightning' },
    { label: 'Build time', value: B.build_ticks + ' days' },
  ].concat(afford ? [] : [{ label: 'Can\u2019t afford', value: 'need more resources', color: 'var(--red-300)', icon: 'warning' }]) };
  return (
    <Tip tip={tip} place="left">
    <div onClick={() => onBuild(type, afford)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
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
    </Tip>
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

function DiplomacyPane({ players, onDiplo, proposals, truceLeft, day }) {
  const { Button, Badge, Pill } = window.IAP_DS;
  const H = window.HUD_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.filter((p) => !p.me).map((p) => {
        const d = DIPLO[p.diplo || 'neutral'], tl = truceLeft(p), access = !!H.ACCESS[p.id];
        const pend = (k) => proposals[p.id + ':' + k];
        const acts = [];
        if (p.diplo === 'neutral' || !p.diplo) acts.push(['alliance', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']);
        if (p.diplo === 'allied') acts.push(['break', 'End alliance', 'ghost']);
        if (p.diplo === 'war') acts.push(['truce', 'Offer truce', 'default']);
        if (p.diplo !== 'war' && !access) acts.push(['access', 'Request access', 'default']);
        return (
          <div key={p.id} style={{ padding: 12, borderRadius: 12, background: 'var(--grad-navy)', border: '1px solid var(--navy-600)', boxShadow: '0 3px 0 var(--navy-950)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 32, borderRadius: 3, background: p.color, transform: 'skewX(var(--skew))' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 14px/1.2 var(--font-body)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>{p.title} · {p.lands.length} lands{p.ai ? ' · AI' : ''}</div>
              </div>
              <Tip tip={HUD_TIPS.diplo[p.diplo || 'neutral']} place="left" style={{ cursor: 'help' }}><Badge kind={d.kind} icon={d.icon}>{d.label}</Badge></Tip>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {access ? <Tip tip={HUD_TIPS.access} place="left" style={{ cursor: 'help' }}><Pill tone="teal" icon="path">Access granted</Pill></Tip> : null}
              {tl ? <Pill tone="sky" icon="hourglass">Truce · {tl} days left</Pill> : null}
              {['alliance', 'access', 'truce'].filter(pend).map((k) => <Pill key={k} icon="hourglass">{{ alliance: 'Alliance', access: 'Access', truce: 'Truce' }[k]} proposed · waiting</Pill>)}
            </div>
            {tl ? <div style={{ marginTop: 8, font: '400 12px/1.4 var(--font-body)', color: 'var(--text-muted)' }}>Truces can’t be broken. You can’t attack each other until Day {day + tl}.</div> : null}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {tl ? null : acts.map(([k, label, v]) => <Button key={k} size="sm" variant={v} disabled={!!pend(k)} style={{ flex: 1 }} onClick={() => onDiplo(p, k)}>{label}</Button>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { BuildPane, TradePane, DiplomacyPane, SectionHead });
