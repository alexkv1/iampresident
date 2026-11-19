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
- Tweaks: scenario (calm / invaded / starving), frosted or solid panels, your slot colour, fog of war on/off, demo speed (1× = real time, 20 s per day).

### Troops, routes and fog of war
- **Markers** (`hud/HudArmies.jsx › MarkerLayer`): one plate per army stack, pinned to the country centroid. It shows the owner colour, the icon of the strongest unit type and the total unit count. Your own stacks get a white outline; stacks of nations you're at war with get a red ring. Markers fade out on the far side of the globe. Click a marker to open Army mode for its country.
- **Marches:** a moving stack slides along a dashed route in the owner's colour, with an arrowhead and a "Day N" arrival chip. A pulsing reticle marks the target. On arrival a gold sword burst (win) or blue shield burst (repelled) plays, ownership updates, and a toast plus a dispatch line appear.
- **Routes** (`hud/hudGeo.js`):
  - **Land:** the shortest path through your own or **allied** countries only, one day per border crossed. Troops can never pass through neutral or enemy countries. When no such path exists, the row says which countries are in the way ("Blocked by Russian Federation") and explains how to unblock it: ally with them, conquer them, ship by sea, or strike.
  - **Sea:** needs at least one Navy unit in the stack; days depend on distance.
  - Hovering a route previews it on the globe.
- **Strike from range** (damages troops and garrisons; **never captures land**):
  - **Artillery barrage:** guns in a stack that borders the target; 2 defence per gun; reusable.
  - **Air strike:** planes within 3 300 km; 4 defence per plane.
  - **Missile strike:** any range; 20 defence; each missile costs 1 500 gold and is used up.
  - **Nuclear strike:** wipes out troops, buildings and 40% of the population; others may declare war on you.
  - A projectile flies along a high arc with a fire trail, then a fire burst plays (a large radioactive burst for nukes).
- **Research** (5th hotbar slot, key R; `hud/HudResearch.jsx`): a weapons track, Artillery → Air Force → Ballistic Missiles → Nuclear Weapons.
  - Costs research points and gold up front, runs one project at a time and takes days.
  - Nukes cost 4 000 research + 40 000 gold + 5 000 minerals, need 3 Research Labs and take 15 days.
  - Locked unit types (Artillery, Air Force) show "Research X first" in the Army mode's Train list.
- **Fog of war:** you see your own and allied lands, wherever your troops are, and one border beyond. Everything else is dimmed on the globe. Enemy stacks there are hidden, defence shows as `?` with an explanation, and the hover card says so. Neutral garrisons (8) are a known rule and are always shown.
- **Combat** mirrors `Combat.php`: defence = 4 (owned) or 8 (neutral) plus defender strength; the attacker wins if stronger and loses `min(.9, def/atk)` of the stack; a failed attack sends survivors back home. Invaded scenario: Kim's 9 armor reach Finland on Day 17. Reinforce Finland from Sweden in time and it holds.
