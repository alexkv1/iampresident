// Bottom HUD: comms (BL), hotbar (BC), globe controls (BR), hover tooltip.
function Comms({ players, events, chat, onSend, solid }) {
  const { Panel, FeedEvent, ChatMessage, Input, Button } = window.IAP_DS;
  const [tab, setTab] = React.useState('feed');
  const [scope, setScope] = React.useState('all');
  const [msg, setMsg] = React.useState('');
  const ref = React.useRef(null);
  const pl = (id) => players.find((p) => p.id === id);
  const lines = chat.filter((m) => m.scope === scope);
  React.useEffect(() => { if (ref.current) ref.current.scrollTop = tab === 'chat' ? ref.current.scrollHeight : 0; }, [tab, chat.length, scope]);
  const send = () => { if (!msg.trim()) return; onSend(msg.trim(), scope); setMsg(''); };
  return (
    <Panel padding={12} style={{ position: 'absolute', left: 14, bottom: 14, width: 380, ...hudSurface(solid) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <TabPlates value={tab} onChange={setTab} tabs={[{ value: 'feed', label: 'Dispatches', icon: 'broadcast' }, { value: 'chat', label: 'Chat', icon: 'chats', count: tab === 'chat' ? 0 : 2 }]} />
        {tab === 'chat' ? (
          <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 999, background: 'var(--navy-950)' }}>
            {['all', 'team'].map((s) => <button key={s} type="button" onClick={() => setScope(s)} style={{ border: 0, cursor: 'pointer', padding: '4px 10px', borderRadius: 999, font: '600 11px/1 var(--font-body)', textTransform: 'uppercase', letterSpacing: '.06em', background: scope === s ? 'var(--navy-600)' : 'transparent', color: scope === s ? '#fff' : 'var(--text-muted)' }}>{s === 'all' ? 'All' : 'Allies'}</button>)}
          </div>
        ) : null}
      </div>
      <div ref={ref} style={{ height: 150, overflow: 'auto', marginRight: -6, paddingRight: 6 }}>
        {tab === 'feed'
          ? events.map((e) => <FeedEvent key={e.id} type={e.type} actor={e.actor} day={e.day}>{e.text}</FeedEvent>)
          : lines.map((m) => { const p = pl(m.pid); return <ChatMessage key={m.id} name={p ? p.name : 'System'} color={p ? p.color : undefined}>{m.body}</ChatMessage>; })}
      </div>
      {tab === 'chat' ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Input size="sm" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') send(); }} placeholder={scope === 'all' ? 'Message the world…' : 'Message your allies…'} maxLength={400} />
          <Button size="sm" icon="paper-plane-right" onClick={send}>Send</Button>
        </div>
      ) : null}
    </Panel>
  );
}

function HotbarSlot({ m, active, count, onClick }) {
  const [hover, setHover] = React.useState(false);
  const lift = active ? -8 : hover ? -3 : 0;
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', width: 86, height: 82, padding: 0, border: '2px solid ' + (active ? 'var(--gold-300)' : 'rgba(124,196,255,.22)'), borderRadius: 14, cursor: 'pointer', background: active ? 'linear-gradient(180deg,#2c4372 0%,#19233b 100%)' : 'rgba(18,26,46,.88)', backdropFilter: 'blur(8px)', boxShadow: (active ? '0 0 0 3px rgba(245,185,66,.25), 0 0 26px rgba(245,185,66,.4), ' : '') + 'inset 0 1px 0 rgba(255,255,255,.1), 0 4px 0 var(--navy-950), 0 10px 20px rgba(0,0,0,.4)', transform: 'translateY(' + lift + 'px)', transition: 'transform 150ms var(--ease-pop), box-shadow 150ms ease, border-color 150ms ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <i className={'ph-fill ph-' + m.icon} style={{ fontSize: 30, color: active ? 'var(--gold-300)' : '#fff', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.4))' }} />
      <span style={{ font: 'italic 800 15px/1 var(--font-display)', textTransform: 'uppercase', letterSpacing: '.04em', color: active ? '#fff' : 'var(--navy-200)' }}>{m.label}</span>
      <KeyCap k={m.key} style={{ position: 'absolute', top: -9, right: -9 }} />
      {count ? <span style={{ position: 'absolute', top: -9, left: -6, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: 'var(--grad-danger)', boxShadow: '0 2px 0 #7a0c27', font: '700 12px/22px var(--font-body)', color: '#fff' }}>{count}</span> : null}
    </button>
  );
}

function Hotbar({ mode, setMode, counts }) {
  return (
    <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20 }}>
      {Object.keys(MODE_META).map((k) => (
        <Tip key={k} place="top" tip={{ title: MODE_META[k].label, icon: MODE_META[k].icon, tone: 'var(--sky-500)', keyHint: MODE_META[k].key, body: HUD_TIPS.modes[k].body }}>
          <HotbarSlot m={MODE_META[k]} active={mode === k} count={counts[k]} onClick={() => setMode(k)} />
        </Tip>
      ))}
    </div>
  );
}

const LENSES = [
  { value: 'political', icon: 'flag-banner', label: 'Political' },
  { value: 'farmland', icon: 'grains', label: 'Farmland', color: 'var(--res-food)' },
  { value: 'minerals', icon: 'diamond', label: 'Minerals', color: 'var(--res-minerals)' },
  { value: 'oil', icon: 'drop', label: 'Oil', color: 'var(--res-oil)' },
];

function RoundBtn({ icon, onClick, title, active, color, tip }) {
  const [p, setP] = React.useState(false);
  return (
    <Tip tip={tip} place="top">
    <button type="button" aria-label={title} onClick={onClick} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid ' + (active ? 'var(--teal-400)' : 'var(--navy-500)'), cursor: 'pointer', display: 'grid', placeItems: 'center', background: active ? 'linear-gradient(180deg,#22485a,#173040)' : 'var(--grad-navy)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1), 0 ' + (p ? 1 : 3) + 'px 0 var(--navy-950)' + (active ? ', var(--glow-teal)' : ''), transform: p ? 'translateY(2px)' : 'none', transition: 'transform 80ms ease' }}>
      <i className={'ph-fill ph-' + icon} style={{ fontSize: 18, color: active ? (color || 'var(--teal-300)') : '#fff' }} />
    </button>
    </Tip>
  );
}

function GlobeControls({ lens, setLens, onZoom, onHome }) {
  return (
    <div style={{ position: 'absolute', right: 14, bottom: 14, width: 340, display: 'flex', alignItems: 'center', gap: 5, padding: 6, borderRadius: 14, background: 'var(--surface-overlay)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-glow)', boxShadow: 'var(--shadow-panel)' }}>
      {LENSES.map((l) => <RoundBtn key={l.value} icon={l.icon} title={l.label + ' lens'} active={lens === l.value} color={l.color} onClick={() => setLens(l.value)} tip={{ ...HUD_TIPS.lens[l.value], icon: l.icon, tone: l.color || 'var(--sky-500)' }} />)}
      <div style={{ flex: 1 }} />
      <RoundBtn icon="minus" title="Zoom out" onClick={() => onZoom(0.35)} tip={HUD_TIPS.zoomOut} />
      <RoundBtn icon="plus" title="Zoom in" onClick={() => onZoom(-0.35)} tip={HUD_TIPS.zoomIn} />
      <RoundBtn icon="crosshair" title="Focus capital" onClick={onHome} tip={HUD_TIPS.focus} />
    </div>
  );
}

function HoverTip({ hover, pos, owner, lens, fogged }) {
  if (!hover) return null;
  const p = hover.props;
  const attr = lens !== 'political' ? lens : null;
  return (
    <div style={{ position: 'absolute', left: pos.x + 18, top: pos.y + 18, pointerEvents: 'none', zIndex: 30, padding: '9px 12px', borderRadius: 10, background: 'rgba(10,14,26,.94)', border: '1px solid var(--border-glow)', boxShadow: '0 8px 24px rgba(0,0,0,.5)', minWidth: 160 }}>
      <div style={{ font: 'italic 900 19px/1 var(--font-display)', textTransform: 'uppercase', color: '#fff' }}>{p.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, font: '600 12px/1 var(--font-body)', color: owner ? (owner.me ? 'var(--teal-300)' : '#fff') : 'var(--text-muted)' }}>
        {owner ? <span style={{ width: 9, height: 9, borderRadius: 3, background: owner.color }} /> : null}{owner ? (owner.me ? 'Yours' : owner.name) : 'Neutral'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 7, font: 'italic 800 14px/1 var(--font-display)', color: '#fff' }}>
        {[['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']].map(([a, r]) => (
          <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, opacity: attr && attr !== a ? 0.45 : 1 }}><i className={'ph-fill ph-' + HUD_RES[r].icon} style={{ color: HUD_RES[r].color, fontSize: 12 }} />{p[a]}</span>
        ))}
      </div>
      {fogged ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,.08)', font: '500 11px/1 var(--font-body)', color: 'var(--navy-300)' }}><i className="ph-fill ph-eye-slash" />Troops hidden by fog of war</div> : null}
    </div>
  );
}

Object.assign(window, { Comms, Hotbar, GlobeControls, HoverTip, LENSES });
