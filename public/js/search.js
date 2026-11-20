// Matchmaking search overlay (design 2a). Shown on the home page for "Join random
// match". Drives connecting -> checking -> found -> entering from real API calls with
// minimum durations; ?vt=1&search=<state> renders a frozen state for the harness.
(function () {
  const q = new URLSearchParams(location.search);
  const VT = q.get('vt') === '1';
  const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324'];
  const esc = (s) => $('<i>').text(s == null ? '' : String(s)).html();

  let leaders = {}, names = {}, el = null, dotTimer = null, clockTimer = null, t0 = 0;

  function persona(code) {
    const L = leaders[code];
    return L ? (L.title + ' ' + L.name) : ('President of ' + (names[code] || code));
  }
  const cname = (code) => names[code] || code;

  function build(claim) {
    const o = document.createElement('div');
    o.className = 'search-overlay';
    o.innerHTML =
      '<div class="search-globe-box"><div class="sg" id="search-globe"></div>' +
        '<div class="search-radar"><span class="ring"></span><span class="ring"></span><span class="ring"></span></div></div>' +
      '<div class="search-fade"></div>' +
      '<div class="search-top"><section class="panel"><div class="panel-body" style="padding:10px 16px">' +
        '<div class="row">' +
          '<span class="wordmark"><span class="wm-iam">I Am</span><span class="wm-pres">President</span></span>' +
          '<span class="pill pill-sky"><i class="ph-fill ph-globe-hemisphere-west"></i>Join random match</span>' +
          '<span class="spacer"></span>' +
          '<span class="timer"><i class="ph-fill ph-hourglass"></i><b id="s-clock">0:00</b></span>' +
          '<button class="btn btn-sm btn-ghost" id="s-cancel"><span><i class="ph-fill ph-x"></i>Cancel</span></button>' +
        '</div>' +
      '</div></section></div>' +
      '<div class="search-your"><section class="panel"><div class="panel-body">' +
        '<header class="panel-head"><h2 class="panel-title">Your nation</h2></header>' +
        '<div style="display:flex;flex-direction:column;gap:6px">' +
          '<div class="sy-name" id="s-nation">' + esc(cname(claim)) + '</div>' +
          '<div class="sy-persona" id="s-persona">' + esc(persona(claim)) + '</div>' +
          '<div class="sy-note">You can switch country in the lobby.</div>' +
        '</div>' +
      '</div></section></div>' +
      '<div class="search-open"><section class="panel"><div class="panel-body">' +
        '<header class="panel-head"><h2 class="panel-title">Open matches</h2></header>' +
        '<div id="s-rows" style="display:flex;flex-direction:column;gap:2px"></div>' +
      '</div></section></div>' +
      '<div class="search-stack">' +
        '<div class="search-plate" id="s-plate"><span><span id="s-plate-main">Finding a match</span><span class="dots" id="s-dots"></span></span></div>' +
        '<div class="search-status" id="s-status"></div>' +
        '<div class="search-seats" id="s-seats"></div>' +
        '<div class="search-progress" id="s-prog"><div></div></div>' +
      '</div>';
    document.body.appendChild(o);
    o.querySelector('#s-cancel').addEventListener('click', () => { if (window.IAP_cancelSearch) window.IAP_cancelSearch(); else close(); });
    return o;
  }

  function close() { if (el) { el.remove(); el = null; } if (dotTimer) clearInterval(dotTimer); if (clockTimer) clearInterval(clockTimer); }

  function scanRow(name, seats, kind) {
    let right = '';
    if (kind === 'queued') right = '<span class="sr-queued">Queued</span>';
    else if (kind === 'checking') right = '<span class="spinner spinner-sm"></span>';
    else if (kind === 'full') right = '<span class="badge badge-danger">Full</span>';
    else if (kind === 'found') right = '<span class="badge badge-ready"><i class="ph-fill ph-check-circle"></i>Seat found</span>';
    const cls = kind === 'checking' ? ' checking' : kind === 'full' ? ' full' : kind === 'found' ? ' found' : '';
    return '<div class="scan-row' + cls + '"><div class="sr-main">' +
      '<div class="sr-name">' + esc(name) + '</div><div class="sr-seats">' + esc(seats) + ' players</div></div>' + right + '</div>';
  }

  function seatStrip(max, players, mine) {
    let h = '';
    for (let i = 0; i < max; i++) {
      if (mine && i === players) h += '<span class="sq me"></span>';
      else h += '<span class="sq" style="' + (i < players ? 'background:' + COLORS[i % COLORS.length] : '') + '"></span>';
    }
    return h;
  }

  function setPlate(found, dots) {
    $('#s-plate').toggleClass('found', !!found);
    $('#s-plate-main').text(found ? 'Match found!' : 'Finding a match');
    $('#s-dots').text(found ? '' : '.'.repeat(dots || 1));
  }

  // ---- frozen vt states (exact rows/timer/dots per the handoff) ----
  const FROZEN = {
    connecting: { clock: '0:00', dots: 1, found: false, status: 'Connecting…',
      rows: [['Cold War Rematch', '8/8', 'queued'], ['Oil & Bread', '4/4', 'queued'], ['World Stage', '3/8', 'queued']],
      seats: [8, 0, false], prog: null },
    checking: { clock: '0:02', dots: 3, found: false, status: 'Checking open matches…',
      rows: [['Cold War Rematch', '8/8', 'full'], ['Oil & Bread', '4/4', 'checking'], ['World Stage', '3/8', 'queued']],
      seats: [8, 0, false], prog: null },
    found: { clock: '0:04', dots: 0, found: true, status: 'Seat found in World Stage · 3/8 players · 20s/tick',
      rows: [['Cold War Rematch', '8/8', 'full'], ['Oil & Bread', '4/4', 'full'], ['World Stage', '3/8', 'found']],
      seats: [8, 3, true], prog: null },
    entering: { clock: '0:04', dots: 0, found: true, status: 'Entering lobby…',
      rows: [['Cold War Rematch', '8/8', 'full'], ['Oil & Bread', '4/4', 'full'], ['World Stage', '3/8', 'found']],
      seats: [8, 3, true], prog: 50 },
  };

  function renderFrozen(name) {
    const f = FROZEN[name]; if (!f) return;
    $('#s-clock').text(f.clock);
    $('#s-rows').html(f.rows.map((r) => scanRow(r[0], r[1], r[2])).join(''));
    setPlate(f.found, f.dots);
    $('#s-status').text(f.status);
    $('#s-seats').html(seatStrip(f.seats[0], f.seats[1], f.seats[2]));
    if (f.prog != null) { $('#s-prog').addClass('on').children().first().css('width', f.prog + '%'); }
  }

  function initGlobe(claim) {
    try {
      const g = new window.Globe(document.getElementById('search-globe'),
        { autoRotate: !VT, spin: VT ? 0 : 0.004, cameraZ: 3, wheelZoom: false });
      g.load('/assets/countries.geo.json').then(() => { if (claim) g.setSelected(claim); });
      g.world && (g.world.rotation.x = 0.3);
    } catch (e) { /* globe is masked in the harness; non-fatal */ }
  }

  // Load reference data (leaders + country names), then run cb.
  function withData(cb) {
    const done = () => cb();
    let pending = 2;
    const tick = () => { if (--pending === 0) done(); };
    $.getJSON('/api/country/leaders').done((r) => { leaders = (r && r.leaders) || {}; }).always(tick);
    $.getJSON('/assets/countries.geo.json').done((fc) => {
      (fc.features || []).forEach((ft) => { names[ft.properties.code] = ft.properties.name; });
    }).always(tick);
  }

  // ---- public: real search flow ----
  let aborted = false;
  window.IAP_cancelSearch = function () { aborted = true; close(); };
  window.IAP_runSearch = function (st) {
    aborted = false;
    withData(() => {
      el = build(st.claim);
      initGlobe(st.claim);
      t0 = (window.IAP_now ? window.IAP_now() : 0);
      runFlow(st);
    });
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  async function runFlow(st) {
    // clock
    const start = Date.now();
    clockTimer = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      $('#s-clock').text('0:' + String(s).padStart(2, '0'));
    }, 250);
    let dots = 1;
    dotTimer = setInterval(() => { dots = dots % 3 + 1; setPlate(false, dots); }, 500);

    setPlate(false, 1); $('#s-status').text('Connecting…');
    let list;
    try { list = await api.listMatches(); } catch (e) { return fail('Could not reach matchmaking.'); }
    if (aborted) return;
    const open = (list.open || []).filter((m) => m.players < m.max_players);
    $('#s-status').text('Checking open matches…');
    renderRows(open, -1);

    let found = null;
    for (let i = 0; i < open.length && !found; i++) {
      renderRows(open, i);
      const t = Date.now();
      try { const r = await api.joinMatch({ match_id: open[i].id }); found = { m: open[i], match_id: r.match_id }; }
      catch (e) { /* full -> next */ }
      const el2 = Math.max(0, 600 - (Date.now() - t));
      await wait(el2);  // each checked row reads for >= 600ms
      if (aborted) return;
    }
    if (!found) {
      try { const r = await api.createMatch({ mode: 'online', max_players: 8, ai_count: 0 });
        found = { m: { name: 'New match', players: 0, max_players: 8, tick_interval_sec: 20 }, match_id: r.match_id, created: true }; }
      catch (e) { return fail('Could not start a match.'); }
    }
    if (aborted) return;

    clearInterval(dotTimer);
    const m = found.m;
    setPlate(true, 0); $('#s-plate').addClass('pop'); setTimeout(() => $('#s-plate').removeClass('pop'), 300);
    $('#s-status').text(found.created ? 'No open seats — starting a new match'
      : 'Seat found in ' + m.name + ' · ' + m.players + '/' + m.max_players + ' players · ' + m.tick_interval_sec + 's/tick');
    $('#s-seats').html(seatStrip(m.max_players, m.players, true));
    await wait(1200);                                  // found hold
    if (aborted) return;

    $('#s-status').text('Entering lobby…');
    $('#s-prog').addClass('on'); requestAnimationFrame(() => $('#s-prog').children().first().css('width', '100%'));
    await wait(900);                                   // entering bar
    clearInterval(clockTimer);
    let u = '/lobby?match=' + found.match_id;
    if (st.claim) u += '&claim=' + st.claim;
    location.href = u;
  }

  function renderRows(open, activeIdx) {
    const rows = open.map((m, i) => scanRow(m.name, m.players + '/' + m.max_players,
      i < activeIdx ? 'full' : i === activeIdx ? 'checking' : 'queued'));
    $('#s-rows').html(rows.join(''));
  }

  function fail(msg) { close(); if (window.UI) UI.err(msg); }

  // ---- boot: frozen vt state ----
  if (VT && q.get('search')) {
    $(function () {
      withData(() => {
        el = build((q.get('claim') || '').toUpperCase());
        initGlobe((q.get('claim') || '').toUpperCase());
        renderFrozen(q.get('search'));
      });
    });
  }
})();
