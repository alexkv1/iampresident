// Lobby: pick a country on the globe, see other players, ready up, host starts.
$(async function () {
  const matchId = window.MATCH_ID;
  let myCountry = null, isHost = false, lastPlayers = [];

  let LEADERS = {};
  api.leaders().then(r => { LEADERS = r.leaders || {}; }).catch(() => {});
  const leaderOf = (code, props) => {
    const l = LEADERS[code];
    return l ? (l.title + " " + l.name) : ("President of " + props.name);
  };

  const globe = new Globe(document.getElementById("globe"), { autoRotate: true });
  await globe.load("/assets/countries.geo.json");
  globe.setSelectable(true);

  globe.onHover((code, props) => {
    const tag = $("#country-tag");
    if (!code) { tag.addClass("hidden"); return; }
    tag.removeClass("hidden");
    tag.find(".cname").text(props.name);
    tag.find(".clead").text("Lead as " + leaderOf(code, props));
    tag.find(".t-farm").text(props.farmland);
    tag.find(".t-min").text(props.minerals);
    tag.find(".t-oil").text(props.oil);
  });

  globe.onSelect((code, props) => {
    api.selectCountry(matchId, code)
      .then(r => { myCountry = code; globe.setSelected(code); UI.ok("You are now " + (r.leader || leaderOf(code, props)) + " of " + props.name); refresh(); })
      .catch(e => UI.err(e.message || "Could not pick that country."));
  });

  $("#btn-ready").on("click", function () {
    const ready = !$(this).hasClass("is-ready");
    api.setReady(matchId, ready)
      .then(() => { $(this).toggleClass("is-ready", ready).text(ready ? "Ready ✓" : "Ready up"); })
      .catch(e => UI.err(e.message));
  });

  $("#btn-start").on("click", function () {
    $(this).prop("disabled", true);
    api.startMatch(matchId)
      .then(() => { location.href = "/game?match=" + matchId; })
      .catch(e => { UI.err(e.message); $(this).prop("disabled", false); });
  });

  function renderPlayers(players) {
    const host = $("#players").empty();
    players.forEach(p => {
      const me = p.id && lastMe && p.id === lastMe.player_id;
      const row = $('<div class="player-row">').toggleClass("me", !!me);
      row.append($('<div class="swatch">').css("background", p.color));
      const info = $('<div style="flex:1">');
      info.append($('<div class="pname">').text(p.display_name));
      info.append($('<div class="pmeta">').text(p.country_code ? ("Leading " + p.country_code) : "Choosing country…"));
      row.append(info);
      if (p.is_ai) row.append($('<span class="badge ai">AI</span>'));
      else if (p.is_ready) row.append($('<span class="badge ready">READY</span>'));
      if (p.is_host) row.append($('<span class="badge">HOST</span>'));
      host.append(row);
    });
  }

  let lastMe = null;
  function refresh() {
    api.getMatch(matchId).then(r => {
      if (r.match.status === "active") { location.href = "/game?match=" + matchId; return; }
      lastMe = r.me;
      $("#match-name").text(r.match.name);
      $("#match-mode").text(r.match.mode.toUpperCase());
      if (r.match.join_code) $("#join-code").removeClass("hidden").text("Code: " + r.match.join_code);

      isHost = !!r.me.is_host;
      $("#btn-start").toggleClass("hidden", !isHost);

      // My chosen country.
      if (r.me.country_code && r.me.country_code !== myCountry) { myCountry = r.me.country_code; globe.setSelected(myCountry); }

      // Colour every player's chosen country on the globe.
      const owners = {};
      r.players.forEach(p => { if (p.country_code) owners[p.country_code] = p.color; });
      globe.setOwners(owners);

      renderPlayers(r.players);
    }).catch(e => { /* transient */ });
  }

  refresh();
  setInterval(refresh, 2000);
});
