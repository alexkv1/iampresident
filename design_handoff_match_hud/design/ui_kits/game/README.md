# Game client UI kit

A click-through recreation of the I Am President web client (`public/pages/{home,lobby,game}`) in the design system's game skin.

**Flow:** Home → choose a mode (or join an open match or a room code) → Lobby: hover the globe to see each country's leader, click to claim one, then Ready up / Start match → Match: the HUD ticks every 6s (the real default is 20s). Click your country to build, watch Dispatches, and chat. Exit returns to Home. Deep links: `index.html#lobby`, `index.html#game`.

| File | Role |
|---|---|
| `index.html` | Loads styles, the DS bundle, three.js r149 + earcut (CDN), then the screens |
| `globe.js` | Restyled port of `public/js/globe.js` (same API, plus `destroy()`) |
| `data.js` | Leaders, building catalogue, start stockpiles and slot colours copied from the repo; mock lobbies |
| `GlobeView.jsx` | React wrapper + shared `TopBar`, `TopTitle`, `GlobeHint` |
| `HomeScreen.jsx` / `LobbyScreen.jsx` / `GameScreen.jsx` | The three screens |
| `App.jsx` | Routing + toast host |

The economy simulation is a simplified client-side imitation of `utils/engine/*` and only exists for the demo. Trade, diplomacy and army UI aren't built in the source yet, so they are omitted here.

## Match HUD mockup (`match-hud.html`)
This is a proposed in-match layout and goes beyond the current skeleton. It uses a 1440×900 stage, scaled to fit the window. All files live in `hud/`.
- **Top row:** identity plate (leader, country silhouette, population vs cap, fed/starving) · Day clock with tick countdown and a world-control bar (each player's share of 176 countries, with a 60% victory marker) · treasury (6 resources with per-day deltas and power-grid efficiency).
- **Alert ribbon** for urgent states (invasion incoming, starvation).
- **Left:** ranked standings with diplomacy state. **Right:** a context panel for the selected country (attributes, land slots), driven by the hotbar mode: Build / Army / Trade / Diplomacy.
- **Bottom:** Dispatches/Chat (all + allies scopes) · hotbar (keys B/A/T/D) · globe lenses (Political/Farmland/Minerals/Oil), zoom and focus capital.
- Data shapes follow `db/schema.sql` (armies, diplomacy, trades, chat scope) and `GameConfig.php` (units, buildings).
- Tweaks: scenario (calm / invaded / starving), frosted or solid panels, your slot colour.
