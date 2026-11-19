// API wrapper — mirrors the yuz jQuery $.ajax pattern. Every call returns a promise.
const api = {
  _post(url, data) {
    return $.ajax({ url, method: "POST", data })
      .then(r => r)
      .catch(xhr => { throw (xhr.responseJSON || { success: false, message: "Network error." }); });
  },
  _get(url, data) {
    return $.ajax({ url, method: "GET", data })
      .then(r => r)
      .catch(xhr => { throw (xhr.responseJSON || { success: false, message: "Network error." }); });
  },

  // auth
  guest(name)        { return this._post("/api/auth/guest", { name: name || "" }); },
  me()               { return this._get("/api/auth/me"); },

  // matches
  createMatch(opts)  { return this._post("/api/match/create", opts); },
  joinMatch(opts)    { return this._post("/api/match/join", opts); },
  listMatches()      { return this._get("/api/match/list"); },
  getMatch(id, sinceEvent) { return this._get("/api/match/get", { match_id: id, since_event: sinceEvent || 0 }); },
  startMatch(id)     { return this._post("/api/match/start", { match_id: id }); },

  // reference data
  leaders()          { return this._get("/api/country/leaders"); },

  // player
  selectCountry(id, code) { return this._post("/api/player/selectCountry", { match_id: id, country_code: code }); },
  setReady(id, ready)     { return this._post("/api/player/setReady", { match_id: id, ready: ready ? 1 : 0 }); },

  // build / chat
  build(id, code, type)   { return this._post("/api/build/queue", { match_id: id, country_code: code, type }); },
  chatSend(id, body)      { return this._post("/api/chat/send", { match_id: id, body }); },
  chatList(id, sinceId)   { return this._get("/api/chat/list", { match_id: id, since_id: sinceId || 0 }); },
};
