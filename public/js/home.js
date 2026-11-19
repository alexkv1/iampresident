// Home page: ensure a guest identity, then create/join matches.
$(function () {
  // Prefill name if already a guest.
  api.me().then(r => { if (r.user) $("#name").val(r.user.display_name); }).catch(() => {});

  function ensureGuest() {
    return api.guest($("#name").val().trim());
  }
  function go(matchId) { location.href = "/lobby?match=" + matchId; }

  function create(mode, extra) {
    ensureGuest()
      .then(() => api.createMatch(Object.assign({ mode }, extra || {})))
      .then(r => go(r.match_id))
      .catch(e => UI.err(e.message || "Could not create match."));
  }

  $("#btn-online").on("click",  () => create("online",  { max_players: 8, ai_count: 0 }));
  $("#btn-private").on("click", () => create("private", { max_players: 8, ai_count: 0 }));
  $("#btn-single").on("click",  () => create("single",  { max_players: 4, ai_count: 3 }));

  $("#btn-join").on("click", () => {
    const code = $("#code").val().trim().toUpperCase();
    if (!code) return UI.err("Enter a room code.");
    ensureGuest()
      .then(() => api.joinMatch({ join_code: code }))
      .then(r => go(r.match_id))
      .catch(e => UI.err(e.message || "Could not join."));
  });

  function renderOpen() {
    api.listMatches().then(r => {
      const list = $("#open-list").empty();
      if (!r.open || !r.open.length) { list.text("No open matches right now — start one!"); return; }
      r.open.forEach(m => {
        const row = $('<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">');
        row.append($('<div>').html(`<b>${$("<i>").text(m.name).html()}</b><br><span class="muted" style="font-size:12px">${m.players}/${m.max_players} players · ${m.tick_interval_sec}s/tick</span>`));
        const join = $('<button class="btn btn-sm btn-primary">Join</button>').on("click", () => {
          ensureGuest().then(() => api.joinMatch({ match_id: m.id })).then(x => go(x.match_id))
            .catch(e => UI.err(e.message));
        });
        row.append(join);
        list.append(row);
      });
    }).catch(() => $("#open-list").text("Could not load matches."));
  }

  // listMatches requires auth; make sure we have a guest, then poll.
  ensureGuest().then(renderOpen).catch(() => {});
  setInterval(renderOpen, 5000);
});
