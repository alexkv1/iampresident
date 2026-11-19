# Match HUD — implementation plan

Porting the design handoff (`design_handoff_match_hud/`) into the live stack (PHP 8.4,
jQuery, three.js r149, plain CSS — no React, no bundler). The visual source of truth is
`design/ui_kits/game/match-hud.html`; exact values come from the `.jsx` files and spec
(`design_handoff_match_hud/README.md`, cited as §).

## Guiding rules
- Copy pixel/colour values **verbatim** from `.jsx`; never round to a 4/8 grid, never invent colours. Use the token CSS variables.
- Phosphor icons only (Fill for game glyphs, Bold for utility). No emoji in UI.
- Numbers via `hudNum()` (§3): `<100 000` full number with ` ` thousands sep; `100K`/`684K`; `10.6M`/`241M` (no decimal ≥100M); `1.40B`.
- Pressables: lip `0 4px 0 <dark>` (3px small) → `:active` `translateY(3px)` + lip 1px over 80ms; `:hover` `translateY(-1px)` + `brightness(1.08)`.

## Current → target gap
| Area | Current (this session's skeleton) | Target |
|---|---|---|
| Tokens/fonts/icons | none; Segoe UI; emoji | token CSS, Barlow Condensed + Rubik woff2, Phosphor fonts |
| Components | ad-hoc classes in `app.css` | `components.css` + `ui-kit.js` ported 1:1 from `design/components/**` |
| Globe | `public/js/globe.js` (conforming refine, green/blue) | DS `globe.js` (brighter palette, `destroy()`, subdivision) + `setZoom`/lenses/focus clamp |
| Game page | `game/index.php` 4-panel skeleton | full HUD overlay with 11 regions, scale-to-fit |
| Game JS | `game.js` polling + simple render | `hud/{top,side,panes,bottom,format}.js` render fns + wired interactions |
| Backend | `match/get`, build, chat | + deltas/efficiency/pop_cap/fed/next_tick_at, armies, trades, diplomacy, land-slot cap |

---

## Step 2 — tokens, fonts, icons (§1)
- Copy `design/tokens/*.css` → `public/css/tokens/`; `design/fonts/*.woff2` → `public/fonts/`; `design/assets/icons/phosphor/{fill,bold}.css` + `*.woff2` → `public/css/phosphor/`.
- **Fix url()s:** `tokens/fonts.css` uses `url('../fonts/…')`; from `public/css/tokens/` that must become `../../fonts/…`. Phosphor `fill.css`/`bold.css` reference their woff2 — verify relative paths resolve from `public/css/phosphor/`.
- Create `public/css/styles.css` = **@import only** (order: fonts, colors, typography, spacing, base, phosphor fill, phosphor bold). No rules.
- Link `/css/styles.css` **before** `app.css` on home, lobby, game (keep app.css for now). Use the existing filemtime cache-bust pattern.
- Verify: no 404s; Barlow Condensed / Rubik / Phosphor glyphs load.

## Step 3 — components → CSS + jQuery (§1 table, `design/components/**`)
- `public/css/components.css`: one BEM-ish class family per component, every value copied from the `.jsx`:
  Button (`.btn` + `--default/--primary/--gold/--danger/--ghost`, `--sm`, `--slanted`, `--block`; variants table from `Button.jsx` BTN_VARIANTS; lip/hover/press shadows), Badge, Pill, Icon (just `.ph-fill`), Input/Field, Card, Panel (`.panel`+`.panel__title` with 5×16 skewed gold tick), Wordmark, ResourceChip, CountryTag, PlayerRow, BuildItem, FeedEvent (+ new types below), ChatMessage, Toast, Spinner, ModeCard.
- `public/js/ui-kit.js`: `UI.button({variant,icon,label,...})` etc. returning markup. Read each `<Name>.d.ts` (props) + `.prompt.md` (usage).
- Add FeedEvent types `war` (sword #e6194b), `battle_repelled` (shield #7cc4ff), `alliance` (handshake #9be8ab), `trade` (handshake #7fe6dc) — §2.7.
- `public/dev/components.php`: render every variant from each `design/components/*/*.card.html`; diff side-by-side and fix.
- Shared bits that live in HudParts (Meter, Ring, Tile, Cost, KeyCap, Silhouette, TabPlates, Eyebrow, DIPLO, HUD_RES, hudNum) → land in `format.js`/components.css in step 6; note them here so step 6 reuses them.

## Step 4 — globe (§2.9, §2.11, Prompt 4)
- Replace `public/js/globe.js` with `design/ui_kits/game/globe.js` (IIFE → `window.Globe`; adds `destroy()`, brighter palette ocean `0x123a7a`/land `0x4d6390`, rim light, two atmosphere shells, subdivision).
- Add per Prompt 4: `setZoom(delta)` clamped **1.6–5**; initial camera **z 2.6** (DS file ships 3.0 — change); `focus(code)` clamps `_targetRotX` ≤ **0.92**; resource lenses — `setLens(lens)` recolouring every country `THREE.Color.lerp(#1c2740 → hex, (attr/100)^0.8)` (farmland #7bc86c, minerals #c9d4ea, oil #a885d8), hiding selection highlight; Political = owners' colours + teal selection.
- `lobby.js`/`game.js` must still work (same public API).
- **Quality watch:** DS globe uses a *non-conforming* 4-split (MAX 2.5°) which can leave faint T-junction cracks (the bug I fixed with conforming refinement). Verify with a headless screenshot of big countries (Canada/Russia/Greenland); if cracks show, port the conforming refinement into the DS globe (keeps its API/palette). Also confirm no blown-out specular (§9).

## Step 5 — backend (§5) — **no DB migrations** (armies/trades/diplomacy/teams already in schema)
- `api/match/get` → `me`: `deltas` (per-resource/tick from a **dry-run** `Economy::step` with no writes), `efficiency`, `pop_cap`, `fed` (food_prod ≥ food_cons OR stock>0), `next_tick_at`, `tick_interval_sec`. Top-level: `armies[]`, `diplomacy` pairs involving me, pending `trades` involving me, land-slot usage per owned country.
- `POST /api/army/train` {type,count,country_code}: validate vs `GameConfig::UNITS`, deduct cost, insert `armies` (status building per build_ticks). 
- `POST /api/army/move` {army_id,to}: `to` ∈ `country_neighbors`; set `moving_to`, `arrive_at_tick` (+2 ticks hostile, +1 own).
- `GET /api/trade/list`; `POST /api/trade/create` {to_player,give,receive}; `POST /api/trade/respond` {id,accept} — atomic resource transfer, emit `trade` event.
- `POST /api/diplomacy/set` {player,state}: emit `war`/`alliance` events. **OPEN QUESTION (ask before coding):** do alliances need the other side to accept (pending state) or apply immediately?
- Chat: honour `scope` `all|team` on send + list (label `team` = "Allies").
- `Build::start`: refuse when country's buildings ≥ `countries.land_slots`.
- Extend `worker/smoke_test.php`: train, move/conquer, trade, diplomacy. Run it.
- Mirror existing patterns in `public/api/*` + `utils/engine/*` (bootstrap, `json_ok/json_err`, `require_auth`, prepared stmts, `realtime_emit`).

## Step 6 — static HUD (§2, Prompt 6)
- Rebuild `public/pages/game/index.php`: full-viewport `#globe`, vignette layer, `.hud` overlay (`position:fixed; inset:0; pointer-events:none`, children `auto`) with **scale-to-fit** `s = min(1, innerW/1440, innerH/900)` (§2). Regions per §2 table.
- `public/css/hud.css`: region styles, exact values from §2.1–§2.13 + `hud/*.jsx`. Reuse `components.css` classes.
- `public/js/hud/{top,side,panes,bottom,format}.js` mirroring `HudTop/HudSide/HudPanes/HudBottom/HudParts.jsx` one-to-one. `format.js` = `hudNum()` per §3 + shared parts.
- Render from mock: copy `hud/hudData.js` → `public/js/hud/mock.js`, gated behind `?mock=1`.
- Match mockup vs `/game?mock=1` at 1440×900 across **calm / invaded / starving** (headless screenshots — puppeteer is set up).

## Step 7 — wire live + interactions (§4, §5, Prompt 7)
- Real data in `game.js`: 3s poll + WS refresh; countdown from `next_tick_at`; hotbar B/A/T/D (ignored while input focused); globe click selects country, standings click selects+focuses that player's capital; context modes → build/army/trade/diplomacy endpoints; alert ribbon rules (§5); chat tabs All/Allies; lenses/zoom/focus; toasts with exact copy (§2.12).
- Remove every emoji from game UI **and** from `GameConfig::BUILDINGS['icon']` → Phosphor names (§2.6 building table).
- Extend `api.js` with army/trade/diplomacy methods.

## Step 8 — visual QA (§9, Prompt 8)
- Screenshot mockup vs `/game?mock=1` at 1440×900 for 3 alert states × 4 hotbar modes (puppeteer). Fix implementation (not mockup) per region. Run §9 acceptance checklist, report pass/fail. Delete now-dead `app.css` rules.

---

## Open questions
1. **Alliance consent (§5, blocking for step 5):** immediate state change, or a pending proposal the other player must accept? (Prompt 5 says ask.)
2. **`.claude/` skill:** currently git-ignored so the installed skill stays local only. OK, or should the skill be committed for teammates?
3. **`design_handoff_match_hud/` in the repo:** committed (~1.5 MB incl. fonts/woff2 + a duplicate `countries.geo.json`). Keep in-repo, or git-ignore after porting?
4. **Minor:** DS `globe.js` ships camera z 3.0 and ocean radius 0.998; spec wants z 2.6. I'll follow the spec. Flagging in case the mockup was tuned to 3.0.
