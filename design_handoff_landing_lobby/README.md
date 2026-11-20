# Handoff: Landing page, matchmaking search and lobby (I Am President)

## Overview
This replaces the home page of `alexkv1/iampresident` with a scrolling landing page aimed at new players from ads and social. It is design **1c**, and it keeps the home page's job: enter a name, pick how to play, then go. It also adds a full-screen **searching** state for "Join random match" (**2a**), and restyles the **lobby** for players who joined (**2b**) and for the host of a private room (**2c**).

Target repo: `alexkv1/iampresident` (`main`). PHP 8.4 pages, vanilla JS and jQuery, three.js globe.
Pages touched: `public/pages/home/index.php`, `public/js/home.js`, `public/pages/lobby/index.php`, `public/js/lobby.js`, `public/js/globe.js`, `public/js/ui.js`, `public/css/app.css`.

## About the design files
Everything under `prototype/` is a **design reference built in HTML**. It shows the intended look and behaviour; it is not production code. It uses React-based design-system components, while the game is vanilla JS and jQuery. **Recreate the designs in the repo's existing stack**: PHP page templates, jQuery and plain CSS classes in `public/css/`. Do not add React or a build step. To get exact values, read the inline styles in `prototype/Landing Page.dc.html` and the component sources in `reference/components/*.jsx`, then port them to CSS classes.

The prototype file is a canvas with several explorations. Only these are in scope:
- `#1c`: the landing page (the bottom-most section, third card)
- `#2a`, `#2b` and `#2c`: the top section

Ignore `#1a` and `#1b`.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, shadows, copy and motion are final. Match them pixel for pixel. The visual test harness in `visual/` checks this (see "Visual testing"). Done means every state passes.

---

## Setup: design tokens, fonts, icons
1. Copy `prototype/_ds/…/tokens/{colors,typography,spacing,base,fonts}.css` into `public/css/tokens/`.
   - Fix the font URLs in `fonts.css` to point at `/fonts/`.
   - Load them before `app.css` on all three pages.
   - `base.css` sets element defaults; check it doesn't break the game page.
2. Copy `prototype/_ds/…/fonts/*.woff2` to `public/fonts/`.
3. Copy `prototype/_ds/…/assets/icons/phosphor/*` to `public/icons/phosphor/`, and link `fill.css` and `bold.css`.
   - Icons are `<i class="ph-fill ph-NAME">`. Input adornments and the select caret use `ph-bold`.
4. Port the design-system components to CSS classes in `app.css`. Restyle the **existing class names in place** (`.btn`, `.btn-primary`, `.btn-gold`, `.btn-ghost`, `.btn-sm`, `.input`, `label.field`, `.card`, `.panel`, `.pill`, `.badge`, `.player-row`, `.country-tag`, `.toast`, `.spinner`, `.mode-card`) so the game page keeps working. Add:
   - `.btn-slanted`: `skewX(-8deg)` on the button, `skewX(8deg)` on the inner span.
   - `.btn-block`
   - a select variant of `.input`
   - `.feed-ev`
   - `.wordmark`

   Exact values for each class:

   | Class | Source file |
   |---|---|
   | `.btn` and variants | `reference/components/Button.jsx` (3D lip, press sinks 3px, 80ms) |
   | `.input`, `label.field` | `Input.jsx`, `Field.jsx` |
   | `.panel` | `Panel.jsx` (translucent, blurred, title with skewed gold tick) |
   | `.card` | `Card.jsx` |
   | `.pill`, `.badge` | `Pill.jsx`, `Badge.jsx` |
   | `.player-row` | `PlayerRow.jsx` |
   | `.country-tag` | `CountryTag.jsx` |
   | `.toast` | `Toast.jsx` |
   | `.spinner` | `Spinner.jsx` |
   | `.mode-card` | `ModeCard.jsx` |
   | `.feed-ev` | `FeedEvent.jsx` |
   | `.wordmark` | `Wordmark.jsx`, size `sm`, layout `inline` |
5. **Globe.** `prototype/globe.js` is a restyled port of `public/js/globe.js` with the same API (`new Globe(el, opts)`, `load`, `onHover`, `onSelect`, `setSelectable`, `setSelected`, `setOwners`, `focus`).
   - Changes: brighter ocean `0x123a7a` and land `0x4d6390`, hover emissive `0x2a3f66`, a two-layer sky atmosphere, a rim light, and `destroy()`.
   - New options: `wheelZoom` (default true), `cameraZ` (default 3.0) and `spin` (radians per frame, default 0.0007).
   - Replace `public/js/globe.js` with it, then smoke-test the game page.
6. `body { overflow: hidden }` in `app.css` must not apply to the home page. Scope it to the lobby and game pages, for example with `body.page-home { overflow: auto }`.

Token quick reference (full list in `reference/tokens/`):

| Group | Values |
|---|---|
| Navy | 950 `#060a14` · 900 `#0a0e1a` (page) · 850 `#0f1526` · 800 `#121a2e` · 750 `#19233b` · 700 `#22304f` · 600 `#27324f` (borders) · 500 `#3a4a74` · 400 `#5a6b96` · 300 `#8a97b8` (muted) · 200 `#b9c3db` · 100 `#e6ebf5` (body) |
| Accents | teal-400 `#4fd1c5` (selection, you) · teal-300 `#7fe6dc` · teal-700 `#1a6f67` · gold-400 `#f6c35a` · gold-300 `#ffd864` · gold-700 `#a8721a` · gold-900 `#2a1c00` · green-500 `#3cb44b` · red-500 `#e6194b` |
| Player slots (`GameConfig::COLORS`) | `#e6194b #3cb44b #4363d8 #f58231 #911eb4 #42d4f4 #f032e6 #bfef45 #fabed4 #469990 #dcbeff #9a6324` |
| Fonts | display `Barlow Condensed` (italic 800/900, uppercase) · body `Rubik` · numbers `Barlow Condensed` 700, tabular |
| Gradients | `--grad-page`, `--grad-navy`, `--grad-gold`, `--grad-teal`, `--grad-danger`, `--grad-protect-b`, `--pattern-stripes` (see `colors.css`) |
| Shadows | `--shadow-panel 0 8px 30px rgba(0,0,0,.45)` · `--shadow-sheen inset 0 1px 0 rgba(255,255,255,.08)` · `--shadow-sheen-strong inset 0 2px 0 rgba(255,255,255,.45)` · `--shadow-inset-well inset 0 2px 0 rgba(0,0,0,.28)` · `--glow-gold 0 0 24px rgba(245,185,66,.45)` · `--glow-teal 0 0 18px rgba(79,209,197,.45)` · `--text-shadow-display 0 2px 0 rgba(0,0,0,.35)` |
| Radii | 4 swatch · 9 row · 10 control · 12 tag · 14 panel · 16 card · 999 pill |

Recurring patterns:
- **Eyebrow:** flex, gap 10. A 14×14 square (radius 2, `--grad-gold`, `skewX(-8deg)`), then text in italic 800 18px/1 display, letter-spacing .06em, uppercase, `--gold-400`.
- **Section H2:** italic 900 72px/.9 display, uppercase, white, `--text-shadow-display`.
- **Gold gradient text** (used for the room code): `linear-gradient(180deg,#fff4cf 0%,#ffd864 38%,#f5b942 62%,#d89a28 100%)` clipped to text, plus `filter: drop-shadow(0 3px 0 rgba(6,10,20,.6))`.

---

## Screen 1c: Landing page (`/`)
Canvas width 1440. The page scrolls; nothing is fixed.

### Hero
**Container:** background `var(--pattern-stripes), var(--grad-page)`; padding `14px 14px 96px`.

**Top bar:** a `.panel` with padding `10px 16px`. Inner row: flex, align center, gap 16, min-height 38, `nowrap`.
- Wordmark (sm, inline).
- `<nav>` with margin-left 12 and gap 4, holding three anchors:
  - "How it works" → `#how`
  - "Leaders" → `#leaders`
  - "Lobby" → `#lobby`
- Anchor style: padding `9px 12px`, radius 10, italic 800 17px/1 display, letter-spacing .04em, uppercase, `--navy-200`. Hover: background `rgba(255,255,255,.06)`, colour white.
- Nothing on the right. No room code, no resources, no Day counter.

**Hero grid:** `grid-template-columns: minmax(0,1fr) 440px`; gap 40; `align-items: start`; padding `72px 42px 0`.

**Left column:** flex column, gap 22, padding-top 30. It holds three skewed plates and a paragraph.

Common plate style:
- Outer: `align-self: flex-start`, `skewX(-8deg)`, radius 14, padding `16px 34px 12px`.
- Inner text: `skewX(8deg)`, italic 900 84px/.86 display, uppercase, white, `nowrap`.

| Plate | Copy | Margin-left | Background and border | Box-shadow | Text-shadow |
|---|---|---|---|---|---|
| 1 | "Lead a nation." | 0 | `--grad-navy`, 1px `--navy-600` | `0 6px 0 var(--navy-950), var(--shadow-panel), var(--shadow-sheen)` | `--text-shadow-display` |
| 2 | "Feed your people." | 44 | same as plate 1 | same as plate 1 | `--text-shadow-display` |
| 3 | "Dominate the world." | 88 | `--grad-danger`, no border | `0 6px 0 #7a0c27, var(--shadow-panel), var(--shadow-sheen-strong)` | `0 3px 0 rgba(90,8,30,.6)` |

Paragraph: margin `26px 0 0 4px`; max-width 560; 400 17px/1.55 Rubik; `--navy-200`; `text-wrap: pretty`.
> "Spin the globe, claim a country and rule it as its real-world leader. Up to 8 players share one world, live in your browser. The first to control 60% of it wins."

**Right column:** a `.panel` titled **"Choose your nation"**, width 440. Body is a flex column with gap 14, containing in order:

1. **Globe well.** Height 380; radius 12; background `radial-gradient(circle at 50% 50%, rgba(63,162,255,.16), transparent 66%)`.
   - The globe canvas fills the well: `{ autoRotate: true, spin: 0.0012, cameraZ: 3.2, wheelZoom: false }`, selectable.
   - On hover, a `.country-tag` sits at the bottom edge of the well (left 0, right 0, bottom 0, `pointer-events: none`). It shows the country name, "Lead as {persona}" and Farmland / Minerals / Oil.
   - In the prototype the globe is absolutely positioned over the well only because of a tooling limitation. Put it inside the well.
2. **Claim status.**
   - Unclaimed: flex, centred, gap 8; padding `12px 14px`; radius 9; 1px dashed `--navy-500`; 400 13px/1.3 muted; icon `ph-hand-pointing` at 16px. Copy: "Drag to rotate · click a country to claim it".
   - Claimed: flex, gap 10; padding `12px 14px`; radius 9; background `rgba(79,209,197,.08)`; 1px `--teal-700`; icon `ph-flag-banner` at 20px in `--teal-400`. Text is 500 14px/1.3 `--navy-100`: "You'll play as **{persona}**", with the persona in white 600.
3. **Field "Your name".** Input with placeholder "President…", maxlength 32, icon `user`.
4. **Field "Match".** A `<select>` styled as `.input`, with icon `globe-hemisphere-west` and a `ph-bold ph-caret-down` caret on the right (padding-right 38). Options in order:
   - **Join random match** (default)
   - **Host private room**
   - **Join private room**
5. **Room code field: only when "Join private room" is selected.** Label "Room code", hint "Ask the host for their code.". Input with placeholder "Enter room code", uppercase, letter-spacing .12em, maxlength 6, icon `key`. Host and random never show a code field.
6. **Button** `.btn-gold.btn-slanted.btn-block` with icon `flag-banner`: **"Take office"**. It is always enabled; a claimed country is optional.

Persona rule, used everywhere: `"{title} {name}"` from `/api/country/leaders`, otherwise `"President of {Country}"`. Country names come from the geojson `props.name`.

### How it works (`#how`)
Layout: padding `110px 56px`; `grid-template-columns: minmax(0,1fr) 540px`; gap 72; `align-items: center`.

**Left column** (flex column, gap 18):
- Eyebrow "How it works".
- H2 "One Day every" / "20 seconds" (two lines).
- Paragraph: margin-top 8, max-width 560, 400 17px/1.55, `--navy-200`.
  > "Every match runs on a shared clock. Each Day your people eat, your buildings produce and armies move. Fed nations grow 1% a day; starving ones shrink 1.5%. The first leader to control 60% of the world wins."

**Right column:** `.panel` titled "Dispatches", width 540. Feed rows with gap 6:

| Event type | Actor | Day | Copy |
|---|---|---|---|
| `match_started` | none | 1 | "The match has begun." |
| `build_complete` | **you** | 4 | "finished a Power Plant." |
| `conquest` | "Kim Jong Un" | 12 | "conquered Republic of Korea" |
| `match_ended` | **you** | 41 | "dominates the world!" ("dominate the world!" when the actor is "You") |

**You** is the claimed country's seeded leader name. If there is none, use the typed name. If that is empty too, use "You".

### Leaders (`#leaders`)
Layout: padding `100px 56px 110px`; background `--navy-850`; 1px `--navy-600` top and bottom borders; flex column, gap 52.

**Header row:** flex, space-between, align end, gap 40.
- Left: eyebrow "Leaders" and H2 "{N} real leaders." / "{M} countries.".
  - N = leader count from the API (55 today). M = geojson feature count (176).
- Right: paragraph, max-width 440, 400 16px/1.5, `--navy-200`.
  > "Claim a seeded country and you play as its head of state, under their real title. Every other country makes you its President. Click a name to claim that country."

**Grid A:** 5 equal columns, gap 32. Groups in order: Supreme Leader, King, Emir, Chancellor, General Secretary.
- Group header: flex, baseline, space-between; padding-bottom 12; 1px `--navy-600` bottom border.
  - Title: italic 900 28px/.95 display, uppercase, `--gold-400`, `--text-shadow-display`.
  - Count: 700 22px/1 Barlow, muted.
- List: column, gap 2. Each name is a button:
  - flex, baseline, space-between; padding `6px 8px`; margin `0 -8px`; radius 6; 500 15px/1.3 Rubik; `--navy-100`.
  - The ISO3 code sits on the right in 600 11px/1, letter-spacing 1px, muted.
  - Hover background `rgba(255,255,255,.06)`. Selected (the claimed country): colour `--teal-300`, background `rgba(79,209,197,.12)`.

**Grid B:** 2 columns, gap 48. Groups: Prime Minister, President.
- Each list is a 3-column grid with gap `2px 24px`.
- Names are 14px with ellipsis and `nowrap`.

Within a group, keep API order. Any unknown title is appended to Grid A. Clicking a name claims that country, exactly like clicking it on the hero globe: the hero globe focuses it, and the claim status and Dispatches actor update. The page does not scroll.

### Lobby (`#lobby`)
Layout: padding `110px 56px 120px`; flex column, gap 36.
- Eyebrow "Lobby" and H2 "Jump into a match".
- Mode cards: 3 columns, gap 20.

| Card | Icon | Tone | Description |
|---|---|---|---|
| Play Online | `globe-hemisphere-west` | sky | "Create a public match strangers can join." |
| Private Room | `lock-key` | violet | "Get a code to play with friends." |
| Single Player | `robot` | gold | "Play solo against the computer (3 AI nations)." |

**Open matches:** a full-width `.panel` titled "Open matches".
- Header row: grid `minmax(0,1fr) 240px 140px 160px 90px`; gap 20; padding `4px 12px 10px`; 1px `--navy-600` bottom border; 500 11px/1.2 Rubik, letter-spacing 1px, uppercase, muted. Columns: [live dot] Match · Seats · Day length · Status · (empty).
- Rows: same grid; padding 12; 1px `rgba(255,255,255,.05)` bottom border; radius 9.
  - Name: 600 16px/1.3 white.
  - Seats: one 16×16 square (radius 4, gap 4) per `max_players`. Filled squares use `COLORS[i]` for `i < players`; empty ones use `--navy-700`. All have `inset 0 1px 0 rgba(255,255,255,.25)`. Then "{players}/{max}" in 700 16px Barlow, muted.
  - Day length: "{tick}s per Day", 400 14px, body colour.
  - Status: "Waiting for players" in muted, or "Full · starting" in `--gold-400`; 500 13px.
  - Join: `.btn-sm.btn-primary`, hidden when full.
  - When a row's data changes, flash its background to `rgba(79,209,197,.09)` with a 500ms transition, then back.
- Live dot: 8px circle in `--green-500`, animated with `@keyframes iapPulse { 0% { box-shadow: 0 0 0 0 rgba(60,180,75,.7) } 100% { box-shadow: 0 0 0 9px rgba(60,180,75,0) } }` over 1.6s ease-out, infinite.
- Data: existing `GET /api/match/list`, polled every 5s. Empty state: "No open matches right now — start one!". Join keeps the existing behaviour (`joinMatch({match_id})` → lobby).

### Footer
Layout: flex, space-between, align center, gap 40; padding `22px 56px`; background `--navy-950`; 1px `--navy-600` top border.
- Left: Wordmark (sm).
- Centre: paragraph, max-width 440, 400 12px/1.5, `--navy-300`, centred.
  > "Leader names and titles follow the current real-world office holders and are updated when governments change."
- Right: links Rules · Privacy · Terms · Contact; gap 28; 500 13px; `--navy-300`. Link targets are TBD.

---

## Take office: behaviour

All three modes:
1. Call `ensureGuest()` (the existing function) with the typed name.
2. On success, carry the claimed country to the lobby as `/lobby?match=ID&claim=XXX`.
3. On lobby load, if `claim` is present, call `selectCountry(match, claim)`.
   - Success: toast "You are now {Title Name} of {Country}". If the country has no seeded leader: "You are now President of {Country}".
   - 409 (taken): `UI.err("That country is already taken.")` and leave the player unselected.

| Dropdown | What happens |
|---|---|
| Join random match | Show the **2a** search overlay on the home page (no navigation). Run `listMatches()`, then try each open match with `players < max_players` in order via `joinMatch({match_id})`. Skip any that return 409. On success, show the found state, then navigate. If none succeed, call `createMatch({mode:'online', max_players:8, ai_count:0})`. That case isn't designed; use plate "Match created!" and status "No open seats — starting a new match". |
| Host private room | `createMatch({mode:'private', max_players:8, ai_count:0})`, then go straight to the lobby (**2c**). No code entry and no search screen. |
| Join private room | Empty code → `UI.err("Enter a room code.")`. Otherwise `joinMatch({join_code})`, then the lobby (**2b** with the code pill). Errors from the API go to `UI.err` with the API message. |

Errors during search: hide the overlay and `UI.err(message)`.

**Invite links:** `/?code=XXXXXX` should preselect "Join private room" and prefill the code. This supports the "Copy invite link" button in 2c.

---

## Screen 2a: Searching (full-screen overlay on `/`, 1440×900)
**Background:** `var(--pattern-stripes), var(--grad-page), var(--bg-page)`.

**Globe:** a 700×700 box, horizontally centred, top 60.
- Options: `{ spin: 0.004, cameraZ: 3, wheelZoom: false }`; `world.rotation.x = 0.3`; the claimed country selected (teal). Not interactive.
- **Radar:** three rings over the globe, each 640px, centred, `border: 2px solid rgba(79,209,197,.55)`, `box-shadow: 0 0 24px rgba(79,209,197,.25)`.
  - Animation: `@keyframes iapRing { 0% { transform: scale(.72); opacity: .75 } 100% { transform: scale(1.3); opacity: 0 } }` over 3s ease-out, infinite, with delays 0s / 1s / 2s.
- A bottom fade, 340px high, using `--grad-protect-b`.

**Top bar** (`.panel`, top/left/right 14, padding `10px 16px`; row gap 14, min-height 36):
- Wordmark.
- Pill (sky, icon `globe-hemisphere-west`): "Join random match".
- Spacer.
- `ph-hourglass` at 18px in muted, then the elapsed timer "0:03" (700 22px/1 Barlow, tabular, white).
- `.btn-sm.btn-ghost` with icon `x`: "Cancel". Before the join succeeds it aborts and hides the overlay. After that it is the same as Leave (go to `/`).

**Left panel "Your nation"** (top 86, left 14, width 270; flex column, gap 6):
- Country name: italic 900 30px/1 display, uppercase, `--teal-300`, `--text-shadow-display`.
- Persona: 500 13px/1.35, `--gold-300`.
- Note (margin-top 6, 400 13px/1.45, muted): "You can switch country in the lobby."
- Hide this panel if no country is claimed. That state isn't designed.

**Right panel "Open matches"** (top 86, right 14, width 300). Rows have gap 2; each row is flex, gap 10, padding `9px 10px`, radius 9, with a 200ms transition on opacity and background.
- Name: 600 14px/1.25 white, ellipsis.
- Meta: "{p}/{max} players", 400 11px/1.3, muted.
- Right side, by row state:

| Row state | Right side | Row style |
|---|---|---|
| Queued | "Queued" in 500 12px `--navy-400` | default |
| Checking | 18px spinner | background `rgba(255,255,255,.05)` |
| Full | `.badge` danger "Full" | opacity .55 |
| Found | `.badge` ready with icon `check-circle`: "Seat found" | background `rgba(79,209,197,.08)` |

**Bottom centre stack** (bottom 64; flex column, centred, gap 18):

1. **Plate.** `skewX(-8deg)`, radius 14, padding `16px 40px 12px`, `transition: transform 320ms var(--ease-pop), background 200ms, box-shadow 200ms`. Text is italic 900 76px/.86 display, uppercase, `nowrap`, counter-skewed.

   | State | Background | Box-shadow | Text | Copy |
   |---|---|---|---|---|
   | Searching | `--grad-navy` | `0 6px 0 var(--navy-950), var(--shadow-panel), var(--shadow-sheen)` | white, `--text-shadow-display` | "Finding a match" plus 1–3 dots stepping every 500ms, in a fixed `.6em` slot so the width never jumps |
   | Found | `--grad-gold` | `0 6px 0 var(--gold-700), var(--glow-gold), var(--shadow-panel)` | `--gold-900`, no shadow | "Match found!" |

   On found, the plate pops: `scale(1.08)` for 300ms, then back to 1.
2. **Status line** (500 16px/1.4, `--navy-200`, min-height 22), in sequence:
   - "Connecting…"
   - "Checking open matches…"
   - "Seat found in {name} · {players}/{max} players · {tick}s/tick"
   - "Entering lobby…"
3. **Seat strip.** One 20×20 square per `max_players`; radius 4; gap 6.
   - While searching: all `--navy-700`.
   - Found: existing players in `COLORS[i]`. Your seat is `--teal-400` with `inset 0 2px 0 rgba(255,255,255,.35), 0 0 0 2px var(--teal-200), var(--glow-teal)`.
   - Other squares: `inset 0 2px 0 rgba(255,255,255,.2), inset 0 -2px 0 rgba(0,0,0,.25)`.
4. **Progress bar.** 360×8, radius 999, background `--navy-850`, `--shadow-inset-well`. Fill uses `--grad-teal` and goes 0 → 100% during "Entering lobby…". Opacity 0 until then.

**Timing.** The prototype loops a slowed 10s demo: connecting 0–0.8s, rows checked at 0.8 / 2.0 / 3.2s (1.2s each), found at 4.8s, entering 6.5–9.5s. In the real app, drive the states from real API calls but enforce minimum durations so it reads:
- each checked row: at least 600ms
- found hold: 1200ms
- entering bar: 900ms
- then `location.href = /lobby?match=ID&claim=XXX`

## Screen 2b: Lobby, joined (`/lobby`)
This restyles the existing lobby. Keep its DOM ids and polling logic.

**Base:** full-screen `#globe` over `var(--grad-page), var(--bg-page)`.
- Globe: `{ autoRotate: true, spin: 0.0007, cameraZ: 3 }`. Keep wheel zoom.
- On load, focus my country. Owners are coloured by player colour via `setOwners`; mine is teal via `setSelected`.

**Top bar** (`.panel.topbar`, gap 14):
- Match name: italic 800 24px/1 display, uppercase, white, `--text-shadow-display`.
- Neutral pill with the mode: "Online" or "Private".
- If there is a `join_code`: gold pill with icon `key`, "Code: K7PX2Q".
- Spacer.
- Meta: "{n}/{max} players · {tick}s/tick" in 400 13px, muted.
- `.btn-sm.btn-ghost` with icon `sign-out`: "Leave" (link to `/`).

**Players panel** (left; gap 4): one `.player-row` per player.
- Swatch in the player's colour, then the name.
- Meta: "Leading {Country name}" (convert the ISO3 code to a name; today's lobby shows the code) or "Choosing country…".
- Badges: READY, HOST, AI. Rows for "me" are tinted.

**Your nation panel** (right; flex column, gap 14):
- Country name: italic 900 30px display, `--teal-300`.
- Persona: 500 13px, `--gold-300`, margin-top 4.
- Paragraph (400 14px/1.45, muted): "Click another country on the globe to switch."
- `.btn.btn-block` "Ready up". When ready it becomes `.btn-primary` with icon `check-circle` and the label "Ready".
- Non-host note (400 13px/1.45, muted): "{host name} starts the match when everyone is ready."
- No country yet: show only the existing hint "Spin the globe and click a country to lead." plus the Ready button.

**Arrival toast.** `.toast.ok`, centred at top 86, single line (`white-space: nowrap`), for example "You are now Supreme Leader Kim Jong Un of Dem. Rep. Korea". Restyle `UI.toast` so the container sits at top 86 on lobby and game pages, below the top bar.

**Country tag:** hover tag at bottom right (300 wide).

**Hint:** bottom centre, 400 12px, muted, with icon `ph-hand-grabbing` at 14px: "Drag to rotate · scroll to zoom · click a country to claim it". The mock leaves out "scroll to zoom" only because wheel zoom is off on the design canvas.

## Screen 2c: Lobby, hosting a private room
This is the same page as 2b, shown when `me.is_host && match.join_code`.

**Top bar:** the same as 2b. The mock shows "Private room" as placeholder text; use the real match name.

**Players panel:** players first, then "Waiting for friends…" placeholder rows until there are 4 rows in total.
- Placeholder row: padding `9px 10px`, radius 9, 1px dashed `--navy-500`, 400 13px/1.25, muted, icon `ph-user-plus` at 16px.

**Centre panel "Invite friends"** (top 86, horizontally centred, width 440; flex column, gap 14):
1. **Code box.** Padding `16px 12px 12px`, radius 12, background `--navy-850`, 2px `--navy-600`, `--shadow-inset-well`. The code is italic 900 72px/.9 display with letter-spacing .14em, padding-left .14em (optical centring) and gold gradient text.
2. **Two buttons** (2-column grid, gap 10):
   - `.btn-sm.btn-block` with icon `copy`: "Copy code". It copies the code; for 1.8s the label becomes "Copied" and the icon `check-circle`.
   - `.btn-sm.btn-ghost.btn-block` with icon `link`: "Copy invite link". It copies `{origin}/?code={code}`.
3. **Note** (400 13px/1.45, muted, centred): "Friends pick Join private room on the home screen and enter this code."

**Right panel:** as in 2b, plus a `.btn-gold.btn-slanted.btn-block` with icon `play`, "Start match" (host only), below Ready up.
- Note: "You're the host. Start when your friends are ready."

**Join toasts.** On a realtime `lobby_update` with `joined`, show a neutral toast with icon `user-plus`, "{name} joined the room.", centred at top 366 (below the Invite panel), single line.

A non-host in a private room sees **2b** with the code pill.

---

## State
**Home:**
- `name`, `claim` (ISO3 or null), `matchMode` (`random` | `host` | `join`), `roomCode`.
- `search`: `idle` | `connecting` | `checking` | `found` | `entering`, plus a `rows` array and `foundMatch`.
- Leaders map (`GET /api/country/leaders`, public).
- Open matches (5s poll).

**Lobby:** the existing state plus:
- `isReady`, `copied` (1.8s timer)
- the pending `claim` from the query string, consumed once

---

## Visual testing (required)
The harness lives in `visual/`. It renders every state from the prototype as the **reference**, renders the same states from your implementation with the API mocked, hides all WebGL canvases on both sides, and pixel-diffs them.

```bash
cd design_handoff_landing_lobby/visual
npm install && npx playwright install chromium
npm run serve:proto              # terminal 1: serves ../prototype on :4173 (it must be served over http)
npm run capture                  # writes reference/full/*.png (with globes) and reference/masked/*.png
php -S 127.0.0.1:8000 -t ../../public ../../public/router.php   # terminal 2: adjust the path to the repo
IMPL_URL=http://127.0.0.1:8000 npm run compare       # or: npm run compare -- lobby-host-alone
```

`compare` writes the following and exits non-zero if any state fails. Pass means at most 1.5% of pixels differ (`MAX_DIFF`) and, for the landing page, the height is within 4px (`MAX_DH`).
- `out/impl/*.png`: your screens
- `out/diff/*.png`: the pixel diff
- `out/side/*.png`: reference | implementation | diff, side by side

States are listed in `visual/states.mjs`. Fixtures in `visual/fixtures/` mirror the prototype's data. Check the response shapes against `public/api/match/get.php` and `list.php`, and adjust the fixtures, not the reference, if a field name differs.

### Test hooks your implementation must support (only when `vt=1` is in the query)
- **`vt=1`** (all pages):
  - globe `autoRotate` off and `spin` 0
  - fetch once, with no polling intervals
  - toasts don't auto-dismiss
  - expose `window.IAP_VT.joined(name)`, which runs the same handler as a realtime `lobby_update {joined}`
- **Home:** `claim=ISO3`, `name=…`, `mode=random|host|join` and `code=…` preset the form.
  - `code` is also the real invite-link behaviour, with or without `vt`.
- **Home:** `search=connecting|checking|found|entering` renders the 2a overlay frozen in that state, using these rows: Cold War Rematch 8/8 (full), Oil & Bread 4/4 (full), World Stage 3/8 (found, 20s/tick). Each frozen state must match the reference exactly:

  | State | Rows | Timer | Plate dots | Other |
  |---|---|---|---|---|
  | `connecting` | all queued | 0:00 | 1 | status "Connecting…" |
  | `checking` | row 1 Full, row 2 checking, row 3 queued | 0:02 | 3 | |
  | `found` | row 1 and row 2 Full, row 3 Seat found | 0:04 | none | plate "Match found!" at scale 1; seats filled (3 players plus you) |
  | `entering` | as `found` | 0:04 | none | progress bar at 50% |

### Process
1. Build one screen at a time: landing, then 2a, then 2b and 2c.
2. Run `compare` for that screen's states.
3. **Open every `out/side/*.png` and look at it**, not just the numbers. Check type (family, weight, italic, size, line-height, uppercase), spacing, colours, shadows and lips, radii, and the skew of the plates and the gold button.
4. Fix and repeat until every state passes and the side-by-sides look identical.
5. Then compare `reference/full/*.png` by eye for the globe areas, which the diff masks: globe size and position, ring placement, teal selection and owner colours.
6. Finally, run the real flows without `vt` (random, host, join with a valid and an invalid code, claim taken) and confirm the game page still works with the new tokens and `globe.js`.

## Known divergences and open questions
- **Player names.** The backend renames a player to their leader persona on `selectCountry` (`display_name` becomes, for example, "Kim Jong Un"). The mock shows usernames. Keep the backend behaviour; the fixtures use the mock names so the screenshots line up.
- **Mode cards** in the landing Lobby section aren't wired in the mock. Suggested:
  - Play Online sets the dropdown to Join random match and scrolls to the hero.
  - Private Room sets Host private room and scrolls to the hero.
  - Single Player calls `createMatch({mode:'single', max_players:4, ai_count:3})` and goes to the lobby (today's behaviour).

  Single Player is intentionally not in the dropdown.
- **Not designed** (use the suggestions above or ask): search with no claimed country, no open seats ("Match created!"), and network errors while searching.
- **Mobile** is not designed. The design is desktop only, at 1440.

## Files
- `prototype/Landing Page.dc.html`: the design. Open it via `npm run serve:proto`, then `http://127.0.0.1:4173/Landing%20Page.dc.html`.
  - It needs network access for three.js and earcut (unpkg).
  - This copy adds the `?freeze`, `ft`, `claim`, `mode`, `name` and `code` query hooks for capture, and uses real slot-order player colours.
- `prototype/globe.js`: the globe to adopt as `public/js/globe.js`.
- `prototype/countries.geo.json`: same as `public/assets/countries.geo.json`.
- `prototype/_ds/…`: design-system tokens, fonts, icons and the runtime bundle used by the prototype.
- `reference/components/*.jsx`: exact component styles to port to CSS.
- `reference/tokens/*.css`: tokens, ready to copy.
- `visual/`: the capture and compare harness, states and fixtures.
