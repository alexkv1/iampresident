<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>I Am President</title>
  <link rel="stylesheet" href="/css/app.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
</head>
<body>
  <div class="center-screen">
    <div class="home-wrap stack">
      <div class="card stack">
        <div>
          <div class="brand"><span class="globe-emoji">🌍</span> I Am President</div>
          <div class="tagline">Lead a nation. Feed your people. Dominate the world.</div>
        </div>

        <label class="field">
          <span>Your name</span>
          <input id="name" class="input" placeholder="President…" maxlength="32">
        </label>

        <div class="mode-grid">
          <button class="mode-card" id="btn-online">
            <h3>🌐 Play Online</h3><p>Create a public match strangers can join.</p>
          </button>
          <button class="mode-card" id="btn-private">
            <h3>🔒 Private Room</h3><p>Get a code to play with friends.</p>
          </button>
          <button class="mode-card full" id="btn-single">
            <h3>🤖 Single Player</h3><p>Play solo against the computer (3 AI nations).</p>
          </button>
        </div>

        <div class="row">
          <input id="code" class="input" placeholder="Enter room code" style="text-transform:uppercase" maxlength="6">
          <button class="btn" id="btn-join">Join</button>
        </div>
      </div>

      <div class="card stack">
        <h2 style="font-size:13px;letter-spacing:1px;color:var(--muted);text-transform:uppercase">Open matches</h2>
        <div id="open-list" class="muted">Loading…</div>
      </div>
    </div>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/home.js"></script>
</body>
</html>
