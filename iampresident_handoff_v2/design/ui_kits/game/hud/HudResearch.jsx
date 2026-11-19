// Research mode: weapons tech track (Artillery → Air Force → Ballistic Missiles → Nuclear Weapons).
function techState(tech, list, sc, labs) {
  if (tech.status === 'done') return { kind: 'done' };
  if (tech.status === 'active') return { kind: 'active' };
  const missing = (tech.requires || []).filter((k) => (list.find((x) => x.key === k) || {}).status !== 'done').map((k) => list.find((x) => x.key === k).name);
  if (missing.length) return { kind: 'locked', reason: 'Requires ' + missing.join(', ') };
  if (tech.labs && labs < tech.labs) return { kind: 'locked', reason: 'Requires ' + tech.labs + ' Research Labs (you have ' + labs + ')' };
  const busy = list.find((x) => x.status === 'active');
  if (busy) return { kind: 'queued', reason: 'Finish ' + busy.name + ' first' };
  const short = Object.keys(tech.cost).filter((k) => (sc.res[k] || 0) < tech.cost[k]);
  if (short.length) return { kind: 'poor', reason: 'Not enough ' + short.map((k) => HUD_RES[k].label.toLowerCase()).join(' and ') };
  return { kind: 'ready' };
}

function TechCard({ tech, st, progress, daysLeft, onResearch, last }) {
  const { Button, Badge } = window.IAP_DS;
  const nuke = tech.danger;
  const chip = { done: ['ready', 'check', 'Researched'], active: ['host', 'hourglass', 'Researching'], locked: ['default', 'lock', 'Locked'], queued: ['default', 'clock', 'Waiting'], poor: ['danger', 'coins', 'Can’t afford'], ready: ['ai', 'flask', 'Available'] }[st.kind];
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34, flexShrink: 0 }}>
        <Tip tip={{ title: tech.name, icon: tech.icon, tone: nuke ? '#b4520c' : 'var(--teal-600)', body: tech.unlocks, stats: [{ label: 'Research', value: tech.cost.research, icon: 'flask', color: 'var(--res-research)' }, { label: 'Gold', value: hudNum(tech.cost.gold), icon: 'coins', color: 'var(--res-gold)' }].concat(tech.cost.minerals ? [{ label: 'Minerals', value: hudNum(tech.cost.minerals), icon: 'diamond' }] : []).concat([{ label: 'Takes', value: tech.days + ' days' }]) }} place="left" style={{ cursor: 'help' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: st.kind === 'done' ? 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), var(--teal-600)' : nuke ? 'linear-gradient(180deg,#ff9f43,#b4520c)' : 'var(--navy-750)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 rgba(0,0,0,.4)', border: st.kind === 'active' ? '2px solid var(--sky-300)' : '0' }}>
            <i className={'ph-fill ph-' + tech.icon} style={{ fontSize: 19, color: st.kind === 'locked' || st.kind === 'queued' ? 'var(--navy-300)' : '#fff' }} />
          </span>
        </Tip>
        {!last ? <span style={{ flex: 1, width: 3, minHeight: 14, margin: '4px 0', borderRadius: 2, background: st.kind === 'done' ? 'var(--teal-400)' : 'var(--navy-600)' }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0, marginBottom: last ? 0 : 10, padding: 10, borderRadius: 12, background: nuke ? 'repeating-linear-gradient(135deg, rgba(245,185,66,.08) 0 10px, rgba(0,0,0,.18) 10px 20px), rgba(40,14,10,.55)' : 'var(--grad-navy)', border: '1px solid ' + (nuke ? '#6b3206' : st.kind === 'active' ? 'var(--sky-700)' : 'var(--navy-600)'), boxShadow: '0 3px 0 var(--navy-950)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, font: 'italic 800 18px/1 var(--font-display)', textTransform: 'uppercase', color: nuke ? 'var(--gold-300)' : '#fff' }}>{tech.name}</span>
          <Badge kind={chip[0]} icon={chip[1]}>{chip[2]}</Badge>
        </div>
        <div style={{ marginTop: 5, font: '400 12px/1.4 var(--font-body)', color: 'var(--navy-200)' }}>{tech.unlocks}</div>
        {st.kind === 'active' ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, font: '600 11px/1 var(--font-body)', color: 'var(--sky-300)' }}><span>{Math.round(progress * 100)}%</span><span style={{ color: 'var(--text-muted)' }}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span></div>
            <Meter value={progress} max={1} color="var(--sky-400)" height={6} />
          </div>
        ) : st.kind !== 'done' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Cost cost={tech.cost} have={{ research: 1e9, gold: 1e9, minerals: 1e9, ...(st.kind === 'poor' ? window.__HUD_RES : {}) }} size={11} />
            <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)' }}><i className="ph-fill ph-hourglass" /> {tech.days}d</span>
            <div style={{ flex: 1 }} />
            {st.kind === 'ready' ? <Button size="sm" variant={nuke ? 'danger' : 'gold'} icon="flask" onClick={() => onResearch(tech)}>Research</Button> : null}
          </div>
        ) : null}
        {st.reason ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, font: '500 11px/1.3 var(--font-body)', color: st.kind === 'poor' ? 'var(--red-300)' : 'var(--text-muted)' }}><i className={'ph-fill ph-' + (st.kind === 'poor' ? 'warning' : 'lock')} />{st.reason}</div> : null}
      </div>
    </div>
  );
}

function ResearchPane({ tech, sc, labs, dayFloat, onResearch }) {
  window.__HUD_RES = sc.res;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, marginBottom: 14, background: 'rgba(6,10,20,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'color-mix(in oklab, var(--res-research) 20%, transparent)' }}><i className="ph-fill ph-flask" style={{ fontSize: 19, color: 'var(--res-research)' }} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 22px/1 var(--font-num)', color: '#fff' }}>{hudNum(sc.res.research)} <span style={{ font: '600 12px/1 var(--font-body)', color: 'var(--green-300)' }}>+{sc.delta.research}/day</span></div>
          <div style={{ marginTop: 3, font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)' }}>{labs} Research Labs · build more to research faster</div>
        </div>
      </div>
      <SectionHead>Weapons</SectionHead>
      {tech.map((x, i) => {
        const st = techState(x, tech, sc, labs);
        const prog = x.status === 'active' ? Math.min(1, x.progress + (dayFloat - x.startDay) / x.days) : 0;
        return <TechCard key={x.key} tech={x} st={st} progress={prog} daysLeft={Math.max(1, Math.ceil((1 - prog) * x.days))} onResearch={onResearch} last={i === tech.length - 1} />;
      })}
    </div>
  );
}

Object.assign(window, { ResearchPane, techState });
