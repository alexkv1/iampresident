# 🌍 I Am President

A browser strategy game. Spin a 3D globe, take the helm of a real country **as its
current leader**, then feed your people, mine resources, trade, build an army, and
dominate the world — online against strangers, in a private room with friends, or
solo against the AI.

This repo is the **architecture + playable core** (a walking skeleton). Everything
runs end‑to‑end today; the visuals are intentionally provisional and meant to be
restyled from design mockups.

---

## Stack

Built to match the `yuz` conventions:

| Layer        | Tech                                                        |
|--------------|-------------------------------------------------------------|
| Core / API   | **PHP 8.4** on Apache, `.htaccess` front‑controller routing |
| Database     | **MySQL 8** via a `mysqli` `DB` wrapper (prepared stmts)     |
| Frontend     | **Vanilla JS + jQuery**; **three.js** (vendored) for the globe |
| Realtime     | **Node.js** WebSocket relay (server→client fan‑out only)    |
| Game clock   | **PHP CLI tick worker** (systemd) — all rules live in PHP   |

**Authority model:** PHP owns every rule. Players submit actions over the HTTP API;
the tick worker resolves the economy/combat/AI on a fixed cadence; Node only pushes
"something changed" events so browsers update live. If Node is down, polling keeps
the game fully playable.

---

## Directory layout

```
public/                 Apache docroot
  .htaccess             routing (extensionless API + pretty pages)
  index.php             -> home
  router.php            dev router for `php -S`
  pages/{home,lobby,game}/index.php
  api/                  JSON endpoints by domain
    auth/  match/  player/  build/  chat/  country/  admin/  tick/
  js/   api.js ui.js globe.js home.js lobby.js game.js  (+ vendored three.min.js, earcut.min.js)
  css/  app.css
  assets/ countries.geo.json  (geometry + attributes, generated)
utils/
  DB.php  functions.php  bootstrap.php  game_helpers.php  Auth/Verify.php
  engine/  GameConfig Economy Population Build Combat Diplomacy AI MatchSetup Tick
worker/
  tick.php              the game heartbeat (CLI daemon)
  gen_countries.js      regenerates seeds + frontend geojson from Natural Earth
  smoke_test.php        end-to-end engine test (no HTTP)
realtime/
  server.js  package.json   Node WS relay
db/
  schema.sql
  seeds/countries.sql  seeds/leaders.sql
conf.php                 secrets (git-ignored; copy from conf.sample.php)
deploy/                  systemd units + Apache vhost example
```

---

## Local setup

Requires PHP 8.4, MySQL 8+, Node 18+.

```bash
# 1. Config
cp conf.sample.php conf.php          # then edit DB creds if needed
#   On this Mac, MySQL answers on the Unix socket, so conf.php uses
#   servername 'localhost' + socket '/tmp/mysql.sock'.

# 2. Database
mysql -u root -e "CREATE DATABASE iampresident CHARACTER SET utf8mb4;"
mysql -u root iampresident < db/schema.sql
mysql -u root iampresident < db/seeds/countries.sql
mysql -u root iampresident < db/seeds/leaders.sql

# 3. Realtime deps
cd realtime && npm install && cd ..

# 4. Run the three processes (separate terminals)
php -S 127.0.0.1:8000 -t public public/router.php      # web + API
node realtime/server.js                                 # WebSocket relay
php worker/tick.php                                      # game clock
```

Open <http://127.0.0.1:8000>, enter a name, and start a match.

> **Regenerating map data:** `node worker/gen_countries.js` rebuilds
> `db/seeds/countries.sql` and `public/assets/countries.geo.json` from
> `public/assets/countries-110m.geojson` (Natural Earth). Country gameplay
> attributes (farmland, minerals, oil, land slots) are derived there.

> **Verify the engine without a browser:** `php worker/smoke_test.php` creates a
> single‑player match, runs ticks, and prints the economy, AI builds, and a combat
> resolution.

---

## How a match works

1. **Lobby** — pick your country on the globe. You instantly become its real leader
   (e.g. choose North Korea → you are *Supreme Leader Kim Jong Un*). The host starts.
2. **Ticks** — every `tick_interval_sec` (default 20s = one in‑game "day") the worker
   resolves production, consumption, population, construction, combat and AI.
3. **Economy** — buildings produce resources scaled by your land's real attributes.
   Farms feed people; mines/oil/power/labs/banks/factories/housing develop the nation.
   **Energy gates output**, so power matters. Food‑poor nations (Saudi Arabia, Egypt)
   must farm hard or **trade** with food‑rich ones — the core decision loop.
4. **Expansion** — move armies to adjacent countries to conquer them. Control 60% of
   the world (or be the last nation standing) to win.

### Playing as the leader

Choosing a country adopts its current real‑world leader as your in‑match persona —
shown in chat, standings and dispatches. The AI is named too. Countries without a
seeded leader fall back to *"President of <Country>"*.

**When a leader changes (election, succession):** update `country_leaders` — either
directly…

```sql
UPDATE country_leaders SET name='New Name', title='President' WHERE code='USA';
```

…or via the admin endpoint, which **also updates any live lobby/running match**:

```bash
curl -X POST http://127.0.0.1:8000/api/admin/setLeader \
  -H "Authorization: Bearer <internal-key>" \
  -d "code=USA&name=New Name&title=President"
```

> ⚠️ The seeded leaders in `db/seeds/leaders.sql` are a best‑effort baseline — verify
> and keep them current.

---

## API surface

All JSON, shape `{ success, message?, ... }`. Auth is a cookie session (anonymous
guest created on first play).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/guest` | create/reuse a guest identity |
| GET  | `/api/auth/me` | current user |
| POST | `/api/match/create` | new match (`mode` online/private/single) |
| POST | `/api/match/join` | join by `join_code` or open `match_id` |
| GET  | `/api/match/list` | open lobbies + your matches |
| GET  | `/api/match/get` | full match state (poll; `since_event` for deltas) |
| POST | `/api/match/start` | host launches the match |
| POST | `/api/player/selectCountry` | claim a country (become its leader) |
| POST | `/api/player/setReady` | lobby ready toggle |
| POST | `/api/build/queue` | start construction |
| POST | `/api/chat/send` · GET `/api/chat/list` | match chat |
| GET  | `/api/country/leaders` | leader map for the UI |
| POST | `/api/admin/setLeader` | *(bearer)* update a leader + propagate |
| POST | `/api/tick/run` | *(bearer)* advance due matches over HTTP (cron option) |

---

## Production deployment

See `deploy/`:

- **`deploy/apache-vhost.conf`** — serves `public/` and reverse‑proxies `/ws` to the
  Node relay (so the browser uses `wss://yourhost/ws`).
- **`deploy/iampresident-tick.service`** — systemd unit for the tick worker.
- **`deploy/iampresident-realtime.service`** — systemd unit for the Node relay.

On the VM: point the vhost at `public/`, set a strong `internal-key` in `conf.php`
and matching `INTERNAL_KEY` env for Node, enable both services. If you'd rather not
run the daemon, call `/api/tick/run` from cron every minute instead.

---

## Tuning the game

All balance lives in `utils/engine/GameConfig.php` — starting stockpiles, building
costs/yields, population growth/starvation, food‑per‑capita, victory threshold,
player colours. Nothing else needs touching to rebalance.

## Known skeleton simplifications (next steps)

- Trade, diplomacy and alliance **endpoints/UI** aren't built yet (tables + engine
  hooks are). Army training/movement works in the engine; no UI button yet.
- Power plants currently produce energy even at zero oil (oil isn't a hard gate yet).
- Country centroids for antimeridian islands (e.g. Fiji) are approximate.
- Visual design is provisional, pending mockups.
