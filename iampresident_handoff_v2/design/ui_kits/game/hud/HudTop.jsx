// Top HUD row: identity plate (TL), clock + world control (TC), treasury (TR), alert ribbon.
function IdentityPlate({ me, countryName, shape, sc, territories, solid }) {
  const { Panel, Badge } = window.IAP_DS;
  const pop = sc.fed ? me.pop : me.pop * 0.985;
  return (
    <Panel style={{ position: 'absolute', top: 14, left: 14, width: 300, ...hudSurface(solid) }} padding={12}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Tip tip={HUD_TIPS.identity} place="bottom" style={{ width: 68, height: 68, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'help', background: 'radial-gradient(circle at 50% 30%, color-mix(in oklab, ' + me.color + ' 40%, #0a0e1a), #0a0e1a 80%)', border: '2px solid ' + me.color, boxShadow: '0 3px 0 rgba(0,0,0,.45), 0 0 20px color-mix(in oklab, ' + me.color + ' 45%, transparent), inset 0 1px 0 rgba(255,255,255,.2)' }}>
          <Silhouette d={shape} color={me.color} size={54} />
        </Tip>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Eyebrow color="var(--gold-300)">{me.title}</Eyebrow>
          <div style={{ marginTop: 4, font: 'italic 900 30px/.92 var(--font-display)', textTransform: 'uppercase', color: '#fff', textShadow: 'var(--text-shadow-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, font: '500 12px/1 var(--font-body)', color: 'var(--text-muted)' }}>
            <i className="ph-fill ph-star" style={{ color: 'var(--gold-400)' }} />{countryName}<span>·</span><i className="ph-fill ph-map-trifold" />{territories} lands
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <Tip tip={{ ...HUD_TIPS.pop, stats: [{ label: 'Now', value: hudNum(pop) }, { label: 'Cap', value: hudNum(me.popCap) }, { label: 'Per day', value: sc.fed ? '+1.0%' : '\u22121.5%', color: sc.fed ? 'var(--green-300)' : 'var(--red-300)' }] }} place="bottom" style={{ flex: 1, cursor: 'help' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>
            <span><i className="ph-fill ph-users-three" style={{ marginRight: 4 }} /><b style={{ font: 'italic 800 16px/1 var(--font-display)', color: '#fff' }}>{hudNum(pop)}</b> / {hudNum(me.popCap)}</span>
            <span style={{ color: sc.fed ? 'var(--green-300)' : 'var(--red-300)', fontWeight: 600 }}>{sc.fed ? '+1.0% / day' : '−1.5% / day'}</span>
          </div>
          <Meter value={pop} max={me.popCap} color={sc.fed ? 'var(--green-500)' : 'var(--red-500)'} height={7} />
        </Tip>
        <Tip tip={sc.fed ? HUD_TIPS.fed : HUD_TIPS.starving} place="bottom" style={{ cursor: 'help' }}><Badge kind={sc.fed ? 'ready' : 'danger'} icon={sc.fed ? 'grains' : 'warning'}>{sc.fed ? 'Fed' : 'Starving'}</Badge></Tip>
      </div>
    </Panel>
  );
}

function WorldClock({ day, secsLeft, tickSec, players, total, victory, solid }) {
  const { Panel } = window.IAP_DS;
  const sh = (p) => (p.share != null ? p.share : p.lands.length / total);
  const ranked = players.slice().sort((a, b) => sh(b) - sh(a));
  const me = players.find((p) => p.me);
  const leader = ranked[0];
  const pct = (p) => (sh(p) * 100).toFixed(1) + '%';
  return (
    <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 500 }}>
      <Tip tip={() => ({ ...HUD_TIPS.day, stats: [{ label: 'Today', value: 'Day ' + day }, { label: 'Next day in', value: secsLeft + 's' }] })} place="bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10, cursor: 'help', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' }}>
        <Ring pct={1 - secsLeft / tickSec} size={42}><i className="ph-fill ph-sun" style={{ fontSize: 18, color: 'var(--gold-300)' }} /></Ring>
        <div style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--grad-gold)', transform: 'skewX(var(--skew))', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 var(--gold-700), 0 8px 18px rgba(0,0,0,.35)' }}>
          <div style={{ transform: 'skewX(calc(var(--skew) * -1))', font: 'italic 900 30px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--gold-900)', letterSpacing: '.02em' }}>Day {day}</div>
        </div>
        <div style={{ font: '500 12px/1.3 var(--font-body)', color: 'var(--text-muted)', width: 70 }}>next day<br /><b style={{ font: 'italic 800 18px/1 var(--font-display)', color: '#fff' }}>0:{String(secsLeft).padStart(2, '0')}</b></div>
      </Tip>
      <Tip tip={{ ...HUD_TIPS.world, stats: ranked.map((p) => ({ label: p.me ? 'You' : p.name.split(' ').slice(-1)[0], value: pct(p) + ' \u00b7 ' + p.lands.length + ' lands', color: p.color })).concat([{ label: 'To win', value: '60% of world score', color: 'var(--gold-300)', icon: 'trophy' }]) }} place="bottom" style={{ cursor: 'help' }}>
      <Panel padding="10px 14px" style={hudSurface(solid)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Eyebrow color="#fff">World control</Eyebrow>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'italic 800 13px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--gold-300)', letterSpacing: '.04em' }}><i className="ph-fill ph-trophy" />Victory at {Math.round(victory * 100)}%</span>
        </div>
        <div style={{ position: 'relative', height: 14, borderRadius: 999, background: 'var(--navy-950)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)', display: 'flex', overflow: 'visible' }}>
          {ranked.map((p, i) => (
            <div key={p.id} style={{ width: sh(p) * 100 + '%', background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 60%), ' + p.color, borderRight: '2px solid var(--navy-950)', borderRadius: i === 0 ? '999px 0 0 999px' : 0, boxShadow: p.me ? 'inset 0 0 0 2px #fff' : 'none' }} />
          ))}
          <div style={{ position: 'absolute', left: victory * 100 + '%', top: -5, bottom: -5, width: 3, marginLeft: -1, background: 'var(--gold-300)', borderRadius: 2, boxShadow: '0 0 10px rgba(245,185,66,.9)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: '500 12px/1 var(--font-body)', color: 'var(--text-muted)' }}>
          <span><span style={{ color: me.color, fontWeight: 700 }}>You</span> {pct(me)} · {me.lands.length} lands</span>
          <span>Leader <b style={{ color: leader.color }}>{leader.name}</b> {pct(leader)}</span>
        </div>
      </Panel>
      </Tip>
    </div>
  );
}

function Treasury({ sc, solid }) {
  const { Panel } = window.IAP_DS;
  const eff = Math.round(sc.efficiency * 100);
  return (
    <Panel style={{ position: 'absolute', top: 14, right: 14, width: 340, ...hudSurface(solid) }} padding={10}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {Object.keys(HUD_RES).map((k) => {
          const m = HUD_RES[k], d = sc.delta[k], empty = sc.res[k] <= 0;
          return (
            <Tip key={k} place="bottom" tip={{ title: m.label, icon: m.icon, tone: m.color, body: HUD_TIPS.res[k].body, stats: [{ label: 'Now', value: hudNum(sc.res[k]), color: empty ? 'var(--red-300)' : undefined }, { label: 'Per day', value: (d >= 0 ? '+' : '\u2212') + Math.abs(d), color: d >= 0 ? 'var(--green-300)' : 'var(--red-300)' }, { label: 'Made by', value: HUD_TIPS.res[k].source }] }} style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px 6px 6px', borderRadius: 10, background: empty ? 'rgba(230,25,75,.12)' : 'var(--navy-850)', boxShadow: empty ? 'inset 0 0 0 1px var(--red-800)' : 'var(--shadow-inset-well)' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'color-mix(in oklab, ' + m.color + ' 20%, transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)' }}>
                <i className={'ph-fill ph-' + m.icon} style={{ fontSize: 16, color: m.color, filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))' }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '700 20px/1 var(--font-num)', color: empty ? 'var(--red-300)' : '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(0,0,0,.4)' }}>{hudNum(sc.res[k])}</div>
                <div style={{ marginTop: 2, font: '600 11px/1 var(--font-body)', color: d >= 0 ? 'var(--green-300)' : 'var(--red-300)', fontVariantNumeric: 'tabular-nums' }}>{d >= 0 ? '+' : '−'}{Math.abs(d)}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/day</span></div>
              </div>
            </Tip>
          );
        })}
      </div>
      <Tip tip={{ ...HUD_TIPS.grid, stats: [{ label: 'Efficiency', value: eff + '%', color: eff < 100 ? 'var(--red-300)' : 'var(--res-energy)' }] }} place="bottom" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, padding: '0 2px', cursor: 'help' }}>
        <i className="ph-fill ph-plug" style={{ fontSize: 14, color: eff < 100 ? 'var(--red-300)' : 'var(--res-energy)' }} />
        <Eyebrow>Power grid</Eyebrow>
        <div style={{ flex: 1 }}><Meter value={sc.efficiency} max={1} color={eff < 100 ? 'var(--red-500)' : 'var(--res-energy)'} height={6} /></div>
        <span style={{ font: 'italic 800 14px/1 var(--font-display)', color: eff < 100 ? 'var(--red-300)' : '#fff' }}>{eff}%</span>
      </Tip>
    </Panel>
  );
}

function AlertRibbon({ alert, day, onAction }) {
  const { Button } = window.IAP_DS;
  if (!alert) return null;
  const war = alert.kind === 'war';
  return (
    <div style={{ position: 'absolute', top: 178, left: '50%', transform: 'translateX(-50%)', animation: 'iap-toast-in .3s var(--ease-pop)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px 10px 10px', borderRadius: 10, transform: 'skewX(var(--skew))', background: war ? 'var(--grad-danger)' : 'linear-gradient(180deg,#ff9f43 0%,#e8731a 55%,#b4520c 100%)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 ' + (war ? '#7a0c27' : '#6b3206') + ', 0 12px 30px rgba(0,0,0,.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, transform: 'skewX(calc(var(--skew) * -1))' }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.25)', animation: 'iap-pulse 1.2s ease-in-out infinite' }}>
            <i className={'ph-fill ph-' + (war ? 'sword' : 'bowl-food')} style={{ fontSize: 24, color: '#fff' }} />
          </span>
          <div>
            <div style={{ font: 'italic 900 22px/1 var(--font-display)', textTransform: 'uppercase', color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.3)' }}>{alert.title}</div>
            <div style={{ marginTop: 3, font: '500 13px/1.2 var(--font-body)', color: 'rgba(255,255,255,.92)' }}>{alert.body}{alert.eta ? ' · arrives Day ' + (day + alert.eta) : ''}</div>
          </div>
          <Button size="sm" variant={war ? 'default' : 'gold'} icon={war ? 'shield' : 'grains'} onClick={onAction} style={{ marginLeft: 6 }}>{war ? 'Defend' : 'Build farm'}</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IdentityPlate, WorldClock, Treasury, AlertRibbon });
