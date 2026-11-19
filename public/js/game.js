// In-match screen: globe + economy HUD + build + standings + dispatches/chat.
$(async function () {
  const matchId = window.MATCH_ID;
  let catalog = {}, myPlayerId = null, selected = null;
  let ownerByCode = {}, playerColor = {}, players = [];
  let myRes = {}, lastEventId = 0, lastChatId = 0, ended = false;

  const RES = [
    ["food", "🌾"], ["energy", "⚡"], ["minerals", "⛏️"],
    ["gold", "💰"], ["oil", "🛢️"], ["research", "🔬"],
  ];

  const globe = new Globe(document.getElementById("globe"), { autoRotate: false });
  await globe.load("/assets/countries.geo.json");
  globe.setSelectable(true);

  globe.onHover((code, props) => {
    const tag = $("#country-tag");
    if (!code) { tag.addClass("hidden"); return; }
    const ownerId = ownerByCode[code];
    const owner = players.find(p => p.id === ownerId);
    tag.removeClass("hidden");
    tag.find(".cname").text(props.name);
    tag.find(".t-owner").text(owner ? owner.display_name : "Neutral");
    tag.find(".t-farm").text(props.farmland);
    tag.find(".t-min").text(props.minerals);
    tag.find(".t-oil").text(props.oil);
  });

  globe.onSelect((code) => { selected = code; renderBuild(); });

  // ---- HUD ----
  function renderHud() {
    const hud = $("#hud").empty();
    RES.forEach(([k, ic]) => {
      hud.append($(`<div class="res ${k}">`).html(
        `<span class="ic">${ic}</span><span class="val">${UI.num(myRes[k] || 0)}</span><span class="nm">${k}</span>`
      ));
    });
  }

  // ---- standings ----
  function renderStandings() {
    const el = $("#standings").empty();
    const sorted = players.slice().sort((a, b) => b.territories - a.territories);
    sorted.forEach(p => {
      const row = $('<div class="player-row">').toggleClass("me", p.id === myPlayerId);
      row.append($('<div class="swatch">').css("background", p.color));
      const info = $('<div style="flex:1">');
      info.append($('<div class="pname">').text(p.display_name + (p.status === "defeated" ? " ☠" : "")));
      info.append($('<div class="pmeta">').text(`${p.territories} 🗺 · ${UI.num(p.pop)} pop`));
      row.append(info);
      if (p.is_ai) row.append($('<span class="badge ai">AI</span>'));
      el.append(row);
    });
  }

  // ---- build panel ----
  function cost(type) {
    const c = catalog[type].cost || {};
    return Object.entries(c).map(([r, a]) => {
      const ic = { gold: "💰", minerals: "⛏️", oil: "🛢️" }[r] || r;
      return `${ic}${a}`;
    }).join("  ");
  }
  function canAfford(type) {
    const c = catalog[type].cost || {};
    return Object.entries(c).every(([r, a]) => (myRes[r] || 0) >= a);
  }

  function renderBuild() {
    const target = $("#build-target"), cat = $("#catalog").empty();
    if (!selected) { target.text("Click a country you control to build.").removeClass("hidden"); $("#my-buildings").empty(); return; }
    const props = globe.getProps(selected);
    const owned = ownerByCode[selected] === myPlayerId;
    target.html(`<b>${props.name}</b> ${owned ? "" : '<span class="muted">— not yours</span>'}`);

    if (owned) {
      Object.entries(catalog).forEach(([type, b]) => {
        const item = $('<div class="build-item">').toggleClass("disabled", !canAfford(type));
        item.append($('<div class="bic">').text(b.icon));
        const info = $('<div style="flex:1">');
        info.append($('<div class="bname">').text(b.name));
        info.append($('<div class="bcost">').text(cost(type) + "  ·  " + b.build_ticks + " days"));
        item.append(info);
        item.on("click", () => {
          if (!canAfford(type)) return UI.err("Not enough resources.");
          api.build(matchId, selected, type)
            .then(r => { myRes = r.resources; renderHud(); renderBuild(); UI.ok(b.name + " started."); refresh(); })
            .catch(e => UI.err(e.message));
        });
        cat.append(item);
      });
    }
    renderMyBuildings();
  }

  function renderMyBuildings() {
    const el = $("#my-buildings").empty();
    if (!selected) return;
    const here = (window._buildings || []).filter(b => b.country_code === selected);
    if (!here.length) return;
    el.append($('<div class="muted" style="margin:10px 0 6px;font-size:12px">Buildings here</div>'));
    here.forEach(b => {
      const c = catalog[b.type] || { icon: "•", name: b.type };
      const status = b.status === "active" ? "✓" : `⏳ day ${b.complete_at_tick}`;
      el.append($('<div class="row" style="justify-content:space-between;font-size:13px;padding:3px 0">')
        .html(`<span>${c.icon} ${c.name}</span><span class="muted">${status}</span>`));
    });
  }

  // ---- events / chat ----
  function pushEvent(e) {
    const names = id => { const p = players.find(x => x.id === id); return p ? p.display_name : "Someone"; };
    let text = null;
    if (e.type === "conquest") text = `<b>${names(e.data.to)}</b> conquered ${e.data.country}`;
    else if (e.type === "build_complete") text = `${names(e.data.player)} completed a ${e.data.type} in ${e.data.country}`;
    else if (e.type === "player_defeated") text = `<b>${names(e.data.player)}</b> has been eliminated`;
    else if (e.type === "match_ended") text = `🏆 <b>${names(e.data.winner)}</b> dominates the world!`;
    else if (e.type === "match_started") text = `The match has begun.`;
    if (!text) return;
    $("#feed").prepend($('<div class="ev">').html(text));
  }

  function renderChat(msgs) {
    const el = $("#chat");
    msgs.forEach(m => {
      lastChatId = Math.max(lastChatId, m.id);
      el.append($('<div class="m">').html(`<span class="who" style="color:${m.color || "#8a97b8"}">${$("<i>").text(m.name || "System").html()}:</span> ${$("<i>").text(m.body).html()}`));
    });
    if (msgs.length) el.scrollTop(el[0].scrollHeight);
  }

  $("#chat-send").on("click", sendChat);
  $("#chat-input").on("keydown", e => { if (e.key === "Enter") sendChat(); });
  function sendChat() {
    const body = $("#chat-input").val().trim();
    if (!body) return;
    $("#chat-input").val("");
    api.chatSend(matchId, body).catch(e => UI.err(e.message));
  }

  // ---- main refresh ----
  function refresh() {
    api.getMatch(matchId, lastEventId).then(r => {
      players = r.players;
      myPlayerId = r.me.player_id;
      window._buildings = r.buildings;

      const me = players.find(p => p.id === myPlayerId);
      if (me) {
        myRes = { food: me.food, energy: me.energy, minerals: me.minerals, gold: me.gold, oil: me.oil, research: me.research };
      }
      if (me) {
        const countryName = me.country_code ? (globe.getProps(me.country_code)?.name || "") : "";
        const persona = (me.leader_title ? me.leader_title + " " : "") + me.display_name;
        $("#nation-name").text(persona + (countryName ? " · " + countryName : ""));
      } else {
        $("#nation-name").text("Your nation");
      }
      $("#tick").text("Day " + r.match.current_tick);

      // ownership maps
      playerColor = {}; players.forEach(p => playerColor[p.id] = p.color);
      ownerByCode = {};
      const owners = {};
      r.territories.forEach(t => { ownerByCode[t.country_code] = t.owner; owners[t.country_code] = playerColor[t.owner]; });
      globe.setOwners(owners);

      renderHud(); renderStandings(); renderBuild();

      (r.events || []).forEach(e => { lastEventId = Math.max(lastEventId, e.id); pushEvent(e); });

      if (r.match.status === "ended" && !ended) {
        ended = true;
        const w = players.find(p => p.id === r.match.winner_player);
        UI.ok("🏆 " + (w ? w.display_name : "Someone") + " has won the game!");
      }
    }).catch(() => {});
    api.chatList(matchId, lastChatId).then(r => renderChat(r.messages || [])).catch(() => {});
  }

  // ---- realtime (optional push; polling is the fallback) ----
  function connectWS() {
    if (!window.WS_URL) return;
    try {
      const ws = new WebSocket(window.WS_URL + "?match_id=" + matchId);
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (["tick", "match_updated", "chat", "match_started"].includes(m.event)) refresh();
      };
      ws.onclose = () => setTimeout(connectWS, 4000);
    } catch (e) { /* polling still works */ }
  }

  refresh();
  setInterval(refresh, 3000);
  connectWS();
});
