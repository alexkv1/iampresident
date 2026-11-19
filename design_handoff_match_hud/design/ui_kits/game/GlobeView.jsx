// React wrapper around window.Globe (globe.js). Full-bleed, fixed behind the HUD.
function GlobeView({ autoRotate = true, selectable = true, owners, selected, focusCode, onHover, onSelect }) {
  const { Spinner } = window.IAP_DS;
  const hostRef = React.useRef(null);
  const globeRef = React.useRef(null);
  const cbs = React.useRef({});
  cbs.current = { onHover, onSelect };
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const g = new window.Globe(hostRef.current, { autoRotate });
    globeRef.current = g;
    let alive = true;
    g.load(window.IAP_DATA.GEO_URL).then(() => {
      if (!alive) return;
      g.setSelectable(selectable);
      g.onHover((c, p) => cbs.current.onHover && cbs.current.onHover(c, p));
      g.onSelect((c, p) => cbs.current.onSelect && cbs.current.onSelect(c, p));
      setReady(true);
    });
    return () => { alive = false; g.destroy(); };
  }, []);
  React.useEffect(() => { if (ready) globeRef.current.setOwners(owners || {}); }, [ready, owners]);
  React.useEffect(() => { if (ready) globeRef.current.setSelected(selected || null); }, [ready, selected]);
  React.useEffect(() => { if (ready && focusCode) globeRef.current.focus(focusCode); }, [ready, focusCode]);

  return (
    <div ref={hostRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      {!ready ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Spinner /></div> : null}
    </div>
  );
}

function GlobeHint({ children }) {
  return (
    <div style={{ position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, font: '400 12px/1 var(--font-body)', color: 'var(--text-muted)', textShadow: '0 1px 2px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>
      <i className="ph-fill ph-hand-grabbing" aria-hidden="true" style={{ fontSize: 14 }} />{children}
    </div>
  );
}

// Top bar shell shared by lobby + match (source: .panel.topbar).
function TopBar({ children }) {
  const { Panel } = window.IAP_DS;
  return (
    <Panel style={{ position: 'fixed', top: 14, left: 14, right: 14, zIndex: 10 }} padding="10px 16px"
      bodyStyle={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56 - 20 }}>
      {children}
    </Panel>
  );
}

function TopTitle({ children }) {
  return <div style={{ font: 'italic 800 24px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--text-strong)', textShadow: 'var(--text-shadow-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{children}</div>;
}

Object.assign(window, { GlobeView, GlobeHint, TopBar, TopTitle });
