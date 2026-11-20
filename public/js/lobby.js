// Lobby (designs 2b / 2c): pick a country on the globe, see players, ready up, host
// invites + starts. ?vt=1 freezes the globe, fetches once and keeps toasts up.
$(async function () {
  const matchId = window.MATCH_ID;
  const q = new URLSearchParams(location.search);
  const VT = q.get('vt') === '1';
  const pendingClaim = (q.get('claim') || '').toUpperCase() || null;

  const esc = (s) => $('<i>').text(s == null ? '' : String(s)).html();
  let LEADERS = {}, myCountry = null, lastMe = null, claimConsumed = false;

  api.leaders().then((r) => { LEADERS = r.leaders || {}; }).catch(() => {});
  const cname = (code) => (globe.props[code] && globe.props[code].name) || code;
  const persona = (code) => { const l = LEADERS[code]; return l ? (l.title + ' ' + l.name) : ('President of ' + cname(code)); };

  const globe = new Globe(document.getElementById('globe'), { autoRotate: !VT, spin: VT ? 0 : 0.0007, cameraZ: 3 });
  await globe.load('/assets/countries.geo.json');
  globe.setSelectable(true);

  globe.onHover((code, props) => {
    const tag = $('#country-tag');
    if (!code) { tag.addClass('hidden').empty(); return; }
    tag.removeClass('hidden').html(
      '<div class="country-tag">' +
        '<div class="ct-name">' + esc(props.name) + '</div>' +
        '<div class="ct-leader">Lead as ' + esc(persona(code)) + '</div>' +
        '<div class="ct-stats">' +
          ctStat('Farmland', 'plant', 'var(--res-food)', props.farmland) +
          ctStat('Minerals', 'mountains', 'var(--res-minerals)', props.minerals) +
          ctStat('Oil', 'drop', 'var(--res-oil)', props.oil) +
        '</div></div>');
  });
  const ctStat = (label, icon, color, val) =>
    '<span class="ct-stat"><span>' + label + '</span><b><i class="ph-fill ph-' + icon + '" style="color:' + color + '"></i>' + (val == null ? '—' : val) + '</b></span>';

  globe.onSelect((code) => {
    api.selectCountry(matchId, code)
      .then(() => { myCountry = code; globe.setSelected(code); refresh(); })
      .catch((e) => UI.err((e && e.message) || 'Could not pick that country.'));
  });

  // ---- toasts (dedicated, positioned per design; no auto-dismiss under vt) ----
  function showToast(kind, place, icon, text) {
    $('.lobby-toast.' + place).remove();
    const wrap = $('<div class="lobby-toast ' + place + '"><div><div class="toast ' + (kind || '') + '">' +
      '<i class="ph-fill ph-' + icon + '"></i><span>' + esc(text) + '</span></div></div></div>');
    $('body').append(wrap);
    if (!VT) setTimeout(() => wrap.remove(), 3500);
  }
  // Same handler as a realtime lobby_update {joined}.
  window.IAP_VT = window.IAP_VT || {};
  window.IAP_VT.joined = (name) => showToast('', 'join', 'user-plus', name + ' joined the room.');

  // ---- ready / start ----
  $('#btn-ready').on('click', function () {
    const ready = !$(this).hasClass('is-ready');
    api.setReady(matchId, ready).then(() => setReadyUI(ready)).catch((e) => UI.err((e && e.message) || 'Error'));
  });
  function setReadyUI(ready) {
    const b = $('#btn-ready').toggleClass('is-ready', ready).toggleClass('btn-primary', ready);
    b.html('<span>' + (ready ? '<i class="ph-fill ph-check-circle"></i>Ready' : 'Ready up') + '</span>');
  }
  $('#btn-start').on('click', function () {
    $(this).prop('disabled', true);
    api.startMatch(matchId).then(() => { location.href = '/game?match=' + matchId; })
      .catch((e) => { UI.err((e && e.message) || 'Error'); $(this).prop('disabled', false); });
  });

  // ---- copy code / invite link ----
  let copyTimer = null;
  $('#copy-code').on('click', function () {
    const code = $('#invite-code').text().trim();
    copy(code);
    const b = $(this); b.html('<span><i class="ph-fill ph-check-circle"></i>Copied</span>');
    clearTimeout(copyTimer); copyTimer = setTimeout(() => b.html('<span><i class="ph-fill ph-copy"></i>Copy code</span>'), 1800);
  });
  $('#copy-link').on('click', function () {
    copy(location.origin + '/?code=' + $('#invite-code').text().trim());
    UI.ok('Invite link copied.');
  });
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { /* ignore */ } }

  // ---- render ----
  function renderPlayers(players, hostCode) {
    const host = $('#players').empty();
    players.forEach((p) => {
      host.append(playerRow(p));
    });
    // 2c: pad with "Waiting for friends…" placeholders up to 4 rows.
    if (hostCode) {
      for (let i = players.length; i < 4; i++) {
        host.append('<div class="player-row placeholder"><i class="ph-fill ph-user-plus"></i>Waiting for friends…</div>');
      }
    }
  }
  function playerRow(p) {
    const me = lastMe && p.id === lastMe.player_id;
    const meta = p.country_code ? ('Leading ' + cname(p.country_code)) : 'Choosing country…';
    const badges = [];
    if (p.is_ready) badges.push(['ready', 'Ready']);
    if (p.is_host) badges.push(['host', 'Host']);
    if (p.is_ai) badges.push(['ai', 'AI']);
    const bh = badges.map((b) => '<span class="badge badge-' + b[0] + '">' + b[1] + '</span>').join('');
    return '<div class="player-row' + (me ? ' me' : '') + '">' +
      '<span class="swatch" style="background:' + esc(p.color) + '"></span>' +
      '<span class="prow-main"><span class="prow-name"><span>' + esc(p.display_name) + '</span></span>' +
      '<span class="prow-meta">' + esc(meta) + '</span></span>' + bh + '</div>';
  }

  function refresh() {
    api.getMatch(matchId).then((r) => {
      if (r.match.status === 'active') { if (!VT) { location.href = '/game?match=' + matchId; return; } }
      lastMe = r.me;
      const isHost = !!r.me.is_host;
      const priv = !!r.match.join_code;

      $('#match-name').text(r.match.name);
      $('#match-mode').text(cap(r.match.mode));
      if (priv) $('#join-code').removeClass('hidden').find('span').text('Code: ' + r.match.join_code);
      else $('#join-code').addClass('hidden');
      $('#match-meta').text(r.players.length + '/' + r.match.max_players + ' players · ' + r.match.tick_interval_sec + 's/tick');

      // 2c host invite panel
      if (isHost && priv) {
        $('#invite-panel').removeClass('hidden');
        $('#invite-code').text(r.match.join_code);
      } else $('#invite-panel').addClass('hidden');

      // my country / your-nation panel
      if (r.me.country_code && r.me.country_code !== myCountry) { myCountry = r.me.country_code; globe.setSelected(myCountry); globe.focus(myCountry); }
      if (myCountry) {
        $('#nation-head').removeClass('hidden');
        $('#nation-name').text(cname(myCountry));
        $('#nation-persona').text(persona(myCountry));
        $('#nation-switch').removeClass('hidden'); $('#nation-hint').addClass('hidden');
      } else {
        $('#nation-head').addClass('hidden');
        $('#nation-switch').addClass('hidden'); $('#nation-hint').removeClass('hidden');
      }

      // ready / start / notes
      setReadyUI(!!(r.players.find((p) => p.id === r.me.player_id) || {}).is_ready);
      $('#btn-start').toggleClass('hidden', !isHost);
      $('#host-note').toggleClass('hidden', !isHost);
      if (!isHost) {
        const h = r.players.find((p) => p.is_host);
        $('#guest-note').removeClass('hidden').text((h ? h.display_name : 'The host') + ' starts the match when everyone is ready.');
      } else $('#guest-note').addClass('hidden');

      // colour owners on the globe
      const owners = {}; r.players.forEach((p) => { if (p.country_code) owners[p.country_code] = p.color; });
      globe.setOwners(owners);
      if (myCountry) globe.setSelected(myCountry);

      renderPlayers(r.players, isHost && priv);

      // arrival toast (consume ?claim= once)
      if (pendingClaim && !claimConsumed) {
        claimConsumed = true;
        api.selectCountry(matchId, pendingClaim).then(() => {
          myCountry = pendingClaim; globe.setSelected(myCountry); globe.focus(myCountry);
          showToast('ok', 'arrival', 'check-circle', 'You are now ' + persona(pendingClaim) + ' of ' + cname(pendingClaim));
          refresh();
        }).catch((e) => {
          if (e && e.code === 409) UI.err('That country is already taken.');
          else UI.err((e && e.message) || 'Could not claim that country.');
        });
      }
    }).catch(() => { /* transient */ });
  }
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  refresh();
  if (!VT) setInterval(refresh, 2000);
});
