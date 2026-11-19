// Left standings + right context panel (selected country × active mode).
function Standings({ players, total, selected, onPick, solid }) {
  const { Panel } = window.IAP_DS;
  const ranked = players.slice().sort((a, b) => b.lands.length - a.lands.length);
  return (
    <Panel title="Standings" actions={<Eyebrow>{players.length} nations</Eyebrow>} padding={12} style={{ position: 'absolute', top: 170, left: 14, width: 300, ...hudSurface(solid) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ranked.map((p, i) => {
          const d = p.me ? null : DIPLO[p.diplo || 'neutral'];
          const sel = p.lands.includes(selected);
          return (
            <div key={p.id} onClick={() => onPick(p.country)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', background: p.me ? 'var(--me-tint)' : sel ? 'rgba(255,255,255,.05)' : 'transparent', boxShadow: p.me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none' }}>
              <span style={{ width: 18, textAlign: 'center', font: 'italic 900 22px/1 var(--font-display)', color: i === 0 ? 'var(--gold-400)' : 'var(--navy-400)', textShadow: i === 0 ? '0 2px 0 var(--gold-800)' : 'none' }}>{i + 1}</span>
              <span style={{ width: 6, height: 30, borderRadius: 3, background: p.color, transform: 'skewX(var(--skew))', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.4)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 14px/1.2 var(--font-body)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, font: '400 11px/1 var(--font-body)', color: 'var(--text-muted)' }}>
                  {p.me ? <span style={{ color: 'var(--teal-300)', fontWeight: 600 }}>You</span> : <Tip tip={HUD_TIPS.diplo[p.diplo || 'neutral']} place="right" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: d.color, fontWeight: 600, cursor: 'help' }}><i className={'ph-fill ph-' + d.icon} />{d.label}</Tip>}
                  <span>·</span>{hudNum(p.pop)} pop{p.ai ? <span style={{ color: 'var(--gold-400)', fontWeight: 600 }}>· AI</span> : null}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: 'italic 800 20px/1 var(--font-display)', color: '#fff' }}>{p.lands.length}</div>
                <div style={{ font: '400 10px/1 var(--font-body)', color: 'var(--text-muted)', marginTop: 2 }}>{((p.share != null ? p.share : p.lands.length / total) * 100).toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

const MODE_META = {
  build: { label: 'Build', icon: 'hammer', key: 'B' },
  army: { label: 'Army', icon: 'sword', key: 'A' },
  research: { label: 'Research', icon: 'flask', key: 'R' },
  trade: { label: 'Trade', icon: 'handshake', key: 'T' },
  diplomacy: { label: 'Diplomacy', icon: 'flag-banner', key: 'D' },
};

function CountryHeader({ code, props, shape, owner, me, used, occ, day }) {
  const { Badge } = window.IAP_DS;
  const mine = owner && owner.me;
  const capital = owner && owner.country === code;
  const attrs = [['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']];
  return (
    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(6,10,20,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Silhouette d={shape} color={owner ? owner.color : 'var(--globe-land)'} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'italic 900 26px/1 var(--font-display)', textTransform: 'uppercase', color: '#fff', textShadow: 'var(--text-shadow-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{props.name}</span>
            {capital ? <i className="ph-fill ph-star" title="Capital" style={{ color: 'var(--gold-400)', fontSize: 16 }} /> : null}
            {occ ? <Tip tip={{ ...HUD_TIPS.occupied, stats: [{ label: 'Integrated on', value: 'Day ' + occ.until }, { label: 'Unrest', value: occ.unrest + '%', color: occ.unrest > 60 ? 'var(--red-300)' : 'var(--gold-300)' }] }} place="left" style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: 'rgba(245,185,66,.14)', boxShadow: 'inset 0 0 0 1px #6b460c', font: 'italic 800 11px/1.3 var(--font-display)', textTransform: 'uppercase', color: 'var(--gold-300)' }}><i className="ph-fill ph-flag-banner" />Occupied · {occ.unrest}%</Tip> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
            {owner ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 12px/1 var(--font-body)', color: mine ? 'var(--teal-300)' : '#fff' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: owner.color }} />{mine ? 'Yours' : owner.name}</span> : <span style={{ font: '600 12px/1 var(--font-body)', color: 'var(--text-muted)' }}>Neutral · garrison 8</span>}
            {owner && !mine ? <Tip tip={HUD_TIPS.diplo[owner.diplo || 'neutral']} place="left" style={{ cursor: 'help' }}><Badge kind={DIPLO[owner.diplo || 'neutral'].kind} icon={DIPLO[owner.diplo || 'neutral'].icon}>{DIPLO[owner.diplo || 'neutral'].label}</Badge></Tip> : null}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
        {attrs.map(([a, r]) => (
          <Tip key={a} place="left" style={{ cursor: 'help' }} tip={{ ...HUD_TIPS.attr[a], stats: [{ label: props.name, value: props[a] + ' / 100', color: HUD_RES[r].color }] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <i className={'ph-fill ph-' + HUD_RES[r].icon} style={{ color: HUD_RES[r].color, fontSize: 13 }} />
              <span style={{ font: 'italic 800 15px/1 var(--font-display)', color: '#fff' }}>{props[a]}</span>
            </div>
            <Meter value={props[a]} max={100} color={HUD_RES[r].color} height={5} />
          </Tip>
        ))}
        <Tip place="left" style={{ cursor: 'help' }} tip={{ ...HUD_TIPS.attr.slots, stats: [{ label: 'Used', value: (mine ? used : 0) + ' of ' + props.land_slots }] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <i className="ph-fill ph-squares-four" style={{ color: 'var(--sky-300)', fontSize: 13 }} />
            <span style={{ font: 'italic 800 15px/1 var(--font-display)', color: '#fff' }}>{mine ? used + '/' : ''}{props.land_slots}</span>
          </div>
          <Meter value={mine ? used : 0} max={props.land_slots} color="var(--sky-400)" height={5} />
        </Tip>
      </div>
    </div>
  );
}

function EmptyNote({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '22px 12px', color: 'var(--text-muted)' }}>
      <i className={'ph-fill ph-' + icon} style={{ fontSize: 34, color: 'var(--navy-400)' }} />
      <div style={{ marginTop: 8, font: 'italic 800 20px/1 var(--font-display)', textTransform: 'uppercase', color: '#fff' }}>{title}</div>
      <div style={{ margin: '6px auto 14px', maxWidth: 240, font: '400 13px/1.4 var(--font-body)' }}>{body}</div>
      {action}
    </div>
  );
}

function ContextPanel({ mode, code, props, shape, owner, me, players, sc, day, queue, occ, proposals, truceLeft, onBuild, onTrain, army, research, onTrade, onDiplo, setMode, solid }) {
  const { Panel } = window.IAP_DS;
  const mm = MODE_META[mode];
  const mine = owner && owner.me;
  let body = null;
  if (mode === 'build') body = mine ? <BuildPane props={props} sc={sc} day={day} queue={queue} onBuild={onBuild} /> : <EmptyNote icon="lock-simple" title="Not your land" body={'Conquer ' + props.name + ' to build farms, mines and power here.'} action={<window.IAP_DS.Button size="sm" variant="danger" icon="sword" onClick={() => setMode('army')}>Plan attack</window.IAP_DS.Button>} />;
  if (mode === 'army') body = <ArmyPane code={code} props={props} owner={owner} sc={sc} onTrain={onTrain} army={army} />;
  if (mode === 'research') body = <ResearchPane {...research} sc={sc} />;
  if (mode === 'trade') body = <TradePane players={players} sc={sc} onTrade={onTrade} />;
  if (mode === 'diplomacy') body = <DiplomacyPane players={players} onDiplo={onDiplo} proposals={proposals} truceLeft={truceLeft} day={day} />;
  const showCountry = mode === 'build' || mode === 'army';
  return (
    <Panel title={mm.label} actions={<KeyCap k={mm.key} />} padding={12} style={{ position: 'absolute', top: 186, right: 14, bottom: 80, width: 340, display: 'flex', flexDirection: 'column', ...hudSurface(solid) }} bodyStyle={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      {showCountry ? <CountryHeader code={code} props={props} shape={shape} owner={owner} me={me} used={queue.filter((b) => b.country === code).length} occ={occ} day={day} /> : null}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginTop: showCountry ? 12 : 0, marginRight: -6, paddingRight: 6 }}>{body}</div>
    </Panel>
  );
}

Object.assign(window, { Standings, ContextPanel, MODE_META, EmptyNote });
