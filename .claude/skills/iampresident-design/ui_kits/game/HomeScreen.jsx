// Home (source: public/pages/home/index.php + public/js/home.js)
function HomeScreen({ name, setName, onCreate, onJoinCode, onJoinMatch, toast }) {
  const { Card, Wordmark, Field, Input, ModeCard, Button } = window.IAP_DS;
  const [code, setCode] = React.useState('');
  const join = () => {
    const c = code.trim().toUpperCase();
    if (!c) return toast('Enter a room code.', 'err');
    onJoinCode(c);
  };
  return (
    <div style={{ height: '100vh', overflow: 'auto', display: 'grid', placeItems: 'center', padding: 24, boxSizing: 'border-box', background: 'var(--pattern-stripes), var(--grad-hero)' }}>
      <div style={{ width: 'min(560px, 94vw)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card tone="hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Wordmark size="md" tagline="Lead a nation. Feed your people. Dominate the world." />
            <Field label="Your name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="President…" maxLength={32} icon="user" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
              <ModeCard icon="globe-hemisphere-west" tone="sky" title="Play Online" description="Create a public match strangers can join." onClick={() => onCreate('online')} />
              <ModeCard icon="lock-key" tone="violet" title="Private Room" description="Get a code to play with friends." onClick={() => onCreate('private')} />
              <ModeCard icon="robot" tone="gold" title="Single Player" description="Play solo against the computer (3 AI nations)." onClick={() => onCreate('single')} style={{ gridColumn: 'span 2' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') join(); }} placeholder="Enter room code" uppercase maxLength={6} />
              <Button onClick={join}>Join</Button>
            </div>
          </div>
        </Card>
        <Card padding={22}>
          <h2 style={{ margin: '0 0 6px', font: 'italic 800 16px/1 var(--font-display)', letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open matches</h2>
          {window.IAP_DATA.OPEN_MATCHES.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div>
                <div style={{ font: '600 15px/1.3 var(--font-body)', color: 'var(--text-strong)' }}>{m.name}</div>
                <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--text-muted)' }}>{m.players}/{m.max_players} players · {m.tick_interval_sec}s/tick</div>
              </div>
              <Button size="sm" variant="primary" onClick={() => onJoinMatch(m)}>Join</Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
