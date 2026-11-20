// Landing page (design 1c): hero globe + claim, leaders grids, match dropdown,
// Take office, open-matches list. The 2a search overlay is added separately.
$(function () {
  const q = new URLSearchParams(location.search);
  const VT = q.get('vt') === '1';
  window.IAP_VT = window.IAP_VT || {};

  const GROUPS_A = ['Supreme Leader', 'King', 'Emir', 'Chancellor', 'General Secretary'];
  const GROUPS_B = ['Prime Minister', 'President'];
  const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324'];

  const state = {
    name: q.get('name') || '',
    claim: (q.get('claim') || '').toUpperCase() || null,
    matchMode: q.get('mode') || 'random',   // random | host | join
    roomCode: (q.get('code') || '').toUpperCase(),
    leaders: {},
    geoReady: false,
  };
  if (q.get('code')) state.matchMode = 'join';   // invite link preselects Join private room

  let globe = null;

  // ---- helpers ----
  const esc = (s) => $('<i>').text(s == null ? '' : String(s)).html();
  const cname = (code) => (globe && globe.props[code] && globe.props[code].name) || code;
  function persona(code) {
    const L = state.leaders[code];
    return L ? (L.title + ' ' + L.name) : ('President of ' + cname(code));
  }

  // ---- globe ----
  function initGlobe() {
    globe = new window.Globe(document.getElementById('hero-globe'),
      { autoRotate: !VT, spin: VT ? 0 : 0.0012, cameraZ: 3.2, wheelZoom: false });
    globe.setSelectable(true);
    globe.load('/assets/countries.geo.json').then(() => {
      state.geoReady = true;
      $('#lead-m').text(Object.keys(globe.props).length || 176);
      if (state.claim) { globe.setSelected(state.claim); globe.focus(state.claim); }
      globe.onHover((code, props) => showTag(code, props));
      globe.onSelect((code) => claim(code));
      renderClaimStatus();
    });
  }

  function showTag(code, props) {
    const tag = $('#hero-tag');
    if (!code || !props) { tag.addClass('hidden').empty(); return; }
    tag.removeClass('hidden').html(
      '<div class="country-tag">' +
        '<div class="ct-name">' + esc(props.name) + '</div>' +
        '<div class="ct-leader">Lead as ' + esc(persona(code)) + '</div>' +
        '<div class="ct-stats">' +
          ctStat('Farmland', 'plant', 'var(--res-food)', props.farmland) +
          ctStat('Minerals', 'mountains', 'var(--res-minerals)', props.minerals) +
          ctStat('Oil', 'drop', 'var(--res-oil)', props.oil) +
        '</div>' +
      '</div>');
  }
  const ctStat = (label, icon, color, val) =>
    '<span class="ct-stat"><span>' + label + '</span>' +
    '<b><i class="ph-fill ph-' + icon + '" style="color:' + color + '"></i>' + (val == null ? '—' : val) + '</b></span>';

  // ---- claim ----
  function claim(code) {
    state.claim = code;
    if (globe) { globe.setSelected(code); globe.focus(code); }
    renderClaimStatus();
    renderFeedYou();
    $('.leader-btn').each(function () { $(this).toggleClass('sel', $(this).data('code') === code); });
  }

  function renderClaimStatus() {
    const el = $('#claim-status');
    if (state.claim) {
      el.attr('class', 'claim-status claimed').html(
        '<i class="ph-fill ph-flag-banner"></i><span>You’ll play as <b>' + esc(persona(state.claim)) + '</b></span>');
    } else {
      el.attr('class', 'claim-status unclaimed').html(
        '<i class="ph-fill ph-hand-pointing"></i><span>Drag to rotate · click a country to claim it</span>');
    }
  }

  // "You" in the Dispatches feed: the claimed country's seeded leader NAME (not the
  // title+name persona); if none, the typed name; if that's empty too, "You".
  function renderFeedYou() {
    const L = state.claim && state.leaders[state.claim];
    let you = L ? L.name : (state.name.trim() || 'You');
    $('.feed-you').text(you);
    $('.feed-verb').text(you === 'You' ? 'dominate the world!' : 'dominates the world!');
  }

  // ---- leaders ----
  function renderLeaders() {
    const byTitle = {};
    Object.keys(state.leaders).forEach((code) => {
      const t = state.leaders[code].title || 'President';
      (byTitle[t] = byTitle[t] || []).push(code);
    });
    $('#lead-n').text(Object.keys(state.leaders).length);

    const known = new Set([...GROUPS_A, ...GROUPS_B]);
    const extraA = Object.keys(byTitle).filter((t) => !known.has(t));  // unknown titles -> grid A

    $('#lgrid-a').html([...GROUPS_A, ...extraA].map((t) => groupHtml(t, byTitle[t])).join(''));
    $('#lgrid-b').html(GROUPS_B.map((t) => groupHtml(t, byTitle[t])).join(''));

    $('.leader-btn').on('click', function () { claim($(this).data('code')); });  // button, not anchor -> no scroll
  }

  function groupHtml(title, codes) {
    codes = codes || [];
    const rows = codes.map((code) => {
      const sel = code === state.claim ? ' sel' : '';
      return '<button type="button" class="leader-btn' + sel + '" data-code="' + code + '">' +
        '<span class="ln">' + esc(state.leaders[code].name) + '</span>' +
        '<span class="lc">' + esc(code) + '</span></button>';
    }).join('');
    return '<div class="lgroup"><div class="lgroup-head">' +
      '<span class="lg-title">' + esc(title) + '</span>' +
      '<span class="lg-count">' + codes.length + '</span></div>' +
      '<div class="lgroup-list">' + rows + '</div></div>';
  }

  // ---- match dropdown ----
  function syncMode() {
    $('#match-mode').val(state.matchMode);
    $('#code-field').toggleClass('hidden', state.matchMode !== 'join');
  }
  $('#match-mode').on('change', function () { state.matchMode = this.value; syncMode(); });
  $('#name').on('input', function () { state.name = this.value; renderFeedYou(); });
  $('#room-code').on('input', function () { state.roomCode = this.value.toUpperCase(); this.value = state.roomCode; });

  // ---- take office ----
  function ensureGuest() { return api.guest(state.name.trim()); }
  function gotoLobby(id) {
    let u = '/lobby?match=' + id;
    if (state.claim) u += '&claim=' + state.claim;
    location.href = u;
  }

  async function takeOffice() {
    try { await ensureGuest(); } catch (e) { return UI.err((e && e.message) || 'Could not start.'); }
    const mode = state.matchMode;
    if (mode === 'host') {
      try { const r = await api.createMatch({ mode: 'private', max_players: 8, ai_count: 0 }); gotoLobby(r.match_id); }
      catch (e) { UI.err((e && e.message) || 'Could not create room.'); }
    } else if (mode === 'join') {
      const code = state.roomCode.trim();
      if (!code) return UI.err('Enter a room code.');
      try { const r = await api.joinMatch({ join_code: code }); gotoLobby(r.match_id); }
      catch (e) { UI.err((e && e.message) || 'Could not join.'); }
    } else {
      runRandom();   // 2a search overlay is layered in separately (window.IAP_runSearch)
    }
  }
  $('#take-office').on('click', takeOffice);

  // Random: join the first open match with a free seat, else create a new online match.
  async function runRandom() {
    if (window.IAP_runSearch) return window.IAP_runSearch(state);   // overlay hook (2a)
    let list;
    try { list = await api.listMatches(); } catch (e) { return UI.err('Could not reach matchmaking.'); }
    const open = (list.open || []).filter((m) => m.players < m.max_players);
    for (const m of open) {
      try { const r = await api.joinMatch({ match_id: m.id }); return gotoLobby(r.match_id); }
      catch (e) { /* 409 full -> next */ }
    }
    try { const r = await api.createMatch({ mode: 'online', max_players: 8, ai_count: 0 }); gotoLobby(r.match_id); }
    catch (e) { UI.err((e && e.message) || 'Could not start a match.'); }
  }

  // ---- mode cards (landing Lobby section) ----
  $('[data-mode-card]').on('click', function () {
    const m = $(this).data('mode-card');
    if (m === 'single') {
      ensureGuest().then(() => api.createMatch({ mode: 'single', max_players: 4, ai_count: 3 }))
        .then((r) => gotoLobby(r.match_id)).catch((e) => UI.err((e && e.message) || 'Could not start.'));
    } else {
      state.matchMode = m === 'private' ? 'host' : 'random'; syncMode();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // ---- open matches ----
  const prevRows = {};
  function renderOpen() {
    api.listMatches().then((r) => {
      const host = $('#open-matches').empty();
      const open = r.open || [];
      if (!open.length) { host.html('<div class="om-empty">No open matches right now — start one!</div>'); return; }
      open.forEach((m) => {
        const full = m.players >= m.max_players;
        const sig = m.players + '/' + m.max_players + '/' + full;
        const flash = prevRows[m.id] && prevRows[m.id] !== sig ? ' flash' : '';
        prevRows[m.id] = sig;
        let sq = '';
        for (let i = 0; i < m.max_players; i++) {
          sq += '<span class="sq" style="background:' + (i < m.players ? COLORS[i % COLORS.length] : 'var(--navy-700)') + '"></span>';
        }
        const statusTxt = full ? 'Full · starting' : 'Waiting for players';
        const statusCol = full ? 'var(--gold-400)' : 'var(--text-muted)';
        const row = $(
          '<div class="om-row' + flash + '">' +
            '<span class="om-name">' + esc(m.name) + '</span>' +
            '<span class="om-seats"><span class="sq-row">' + sq + '</span>' +
              '<span class="cnt">' + m.players + '/' + m.max_players + '</span></span>' +
            '<span class="om-speed">' + m.tick_interval_sec + 's per Day</span>' +
            '<span class="om-status" style="color:' + statusCol + '">' + statusTxt + '</span>' +
            '<span class="om-join"></span>' +
          '</div>');
        if (!full) {
          const j = $('<button class="btn btn-sm btn-primary"><span>Join</span></button>').on('click', () => {
            ensureGuest().then(() => api.joinMatch({ match_id: m.id })).then((x) => gotoLobby(x.match_id))
              .catch((e) => UI.err((e && e.message) || 'Could not join.'));
          });
          row.find('.om-join').append(j);
        }
        if (flash) setTimeout(() => row.removeClass('flash'), 520);
        host.append(row);
      });
    }).catch(() => { $('#open-matches').html('<div class="om-empty">Could not load matches.</div>'); });
  }

  // ---- boot ----
  if (state.name) $('#name').val(state.name);
  if (state.roomCode) $('#room-code').val(state.roomCode);
  syncMode();
  renderFeedYou();
  initGlobe();

  api.leaders().then((r) => { state.leaders = r.leaders || {}; renderLeaders(); renderClaimStatus(); renderFeedYou(); })
    .catch(() => {});

  if (!VT) {
    api.me().then((r) => { if (r.user && !state.name) { state.name = r.user.display_name; $('#name').val(state.name); renderFeedYou(); } }).catch(() => {});
    ensureGuest().then(renderOpen).catch(renderOpen);
    setInterval(renderOpen, 5000);
  } else {
    renderOpen();   // fetch once, no polling
  }
});
