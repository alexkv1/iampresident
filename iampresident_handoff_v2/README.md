# Handoff: In-match HUD (I Am President)

## Overview
This is the in-match screen of **I Am President**, the realtime multiplayer globe strategy game in `alexkv1/iampresident`. It replaces the provisional skeleton screen (`public/pages/game/index.php` + `public/js/game.js` + `public/css/app.css`) with the new game design system and the full match HUD:

- identity plate
- Day clock with world-control bar
- treasury with per-day deltas
- alert ribbon
- ranked standings
- context panel for the selected country, with four modes: Build, Army, Trade, Diplomacy
- Dispatches/Chat panel
- hotbar
- globe lenses
- hover tooltip

**The goal is a pixel-exact implementation of `design/ui_kits/game/match-hud.html`, built with the new design system tokens and components.**

> **Start here:** open `CLAUDE_CODE_PROMPTS.md` for copy-paste prompts in order (install design system → port components → globe → backend → HUD → wire-up → visual QA). `design/` is also a complete Claude Code skill (`design/SKILL.md`); copy it to `.claude/skills/iampresident-design/`.

## Phase 2 (v2): realistic war, tooltips and research
> **Day length: 20 seconds** (1 tick = 1 day): 3 days per real minute. Set `tick_interval_sec` default to 20 everywhere. Training uses batches of 5 with slots (see GAME_RULES §1a).
New since the first handoff. Implement these after the base HUD, using `CLAUDE_CODE_PROMPTS_PHASE2.md`:
- **`GAME_RULES.md`** is the authoritative rules spec: units with attack, defence, speed and upkeep; distance-based movement; land routes only through your own lands or lands that granted you access; sea transport capacity and coastal-only landings; combat with a defender ×1.5 bonus, terrain and ±15% randomness; scaled garrisons and starting resources; weighted victory; occupation and unrest; consent-based diplomacy and unbreakable truces; research and strikes (artillery, air, three missile tiers, nukes); server-enforced fog of war; schema migration.
- **Tooltip component** (`design/components/feedback/Tooltip.*`): explainer pop-ups on every HUD icon. The copy is in `hud/hudTips.js`.
- **HUD additions in the mockup:**
  - troop markers, march routes, reticles, battle and strike bursts (`HudArmies.jsx`),
  - route planning with blocked reasons and win chance,
  - Research mode (5th hotbar slot, key R; `HudResearch.jsx`),
  - Diplomacy proposals, access and truce countdown,
  - occupation badge,
  - Manpower and Upkeep tiles,
  - fog-of-war dimming.
- **Tweaks** in the mockup (scenario, fog, demo speed) are design aids, not features.

## About the design files
Everything in `design/` is a **design reference written in HTML/React**. It is a working prototype that shows the exact look and behaviour; it is not production code to paste in. Recreate it inside the game's existing stack: PHP 8.4 pages, vanilla JS + jQuery, three.js r149 and plain CSS. Don't add React or a bundler unless the team decides to.

- Open `design/ui_kits/game/match-hud.html` in a browser through a local static server (`npx serve design`), because it fetches the GeoJSON. This is the source of truth for layout and visuals.
- `design/components/**/X.jsx` are the design-system components. Each value in them (padding, radius, shadow, font) is the spec. Port each one to a CSS class plus a small render helper with **identical values**.
- `design/ui_kits/game/hud/*.jsx` are the HUD regions that compose those components. Every pixel value in this README was taken from those files. If this README and the code disagree, **the code wins**.
- Ignore `hud/tweaks-panel.jsx` and the `TweaksPanel` block in `MatchHud.jsx`. They are prototype-only controls for switching scenario, panel style and player colour.

## Fidelity
**High-fidelity.** Colours, type, spacing, radii, shadows, hover/press states and copy are final. Match them exactly. Do not round values to a 4/8px grid.

---

## 1. Install the design system into the codebase

| From `design/` | To codebase | Notes |
|---|---|---|
| `tokens/colors.css`, `typography.css`, `spacing.css`, `base.css`, `fonts.css` | `public/css/tokens/` | Fix `url('../fonts/…')` in fonts.css to the new font path |
| `fonts/*.woff2` | `public/fonts/` | Barlow Condensed + Rubik (Google Fonts, OFL) |
| `assets/icons/phosphor/{fill,bold}.css` + `.woff2` | `public/css/phosphor/` | Phosphor Icons v2.1.1 (MIT). Use `<i class="ph-fill ph-coins">` |
| `styles.css` | `public/css/styles.css` | `@import` list only; link it from every page **instead of** `app.css` |
| `ui_kits/game/globe.js` | replaces `public/js/globe.js` | Same public API, plus `destroy()`. Adds triangle subdivision (fixes holes in large countries), the brighter palette, and a toned-down specular |

Then write `public/css/components.css`, with one class family per design-system component, ported from `design/components/**/*.jsx`:

| Component (JSX) | CSS class family | Used in HUD for |
|---|---|---|
| `core/Button` | `.btn` + `--gold / --primary / --danger / --ghost`, `.btn--sm`, `.btn--slanted`, `.btn--block` | Every action |
| `core/Badge` | `.badge--ready / --ai / --host / --danger` | Fed/Starving, diplomacy state |
| `core/Pill` | `.pill`, `.pill--solid.pill--gold` | "Pending" |
| `core/Icon` | `.ph-fill.ph-*` (no wrapper needed) | – |
| `forms/Input` | `.input`, `.input--sm` | Chat composer |
| `surfaces/Panel` | `.panel` + `.panel__title` (with the skewed gold tick) | All HUD panels |
| `feed/FeedEvent` | `.feed-ev` + `--<type>` (icon/colour per type) | Dispatches |
| `feed/ChatMessage` | `.chat-msg` | Chat |
| `feedback/Toast` | `.toast--ok / --err / --default` | Toasts |

Press and hover states are part of the spec. Pressables have a solid "lip" shadow: `0 4px 0 <dark shade>` (3px for small elements). On `:active` they move `translateY(3px)` and the lip shrinks to 1px over 80ms. On hover they lift `translateY(-1px)` and get `filter: brightness(1.08)`. See `Button.jsx`.

---

## 2. Screen layout

The prototype draws on a **1440×900 reference stage**. In production:
- The globe canvas fills the viewport (`position: fixed; inset: 0`).
- The HUD overlay is `position: fixed; inset: 0; pointer-events: none`. Its children use `pointer-events: auto`.
- Let `s = min(1, innerWidth/1440, innerHeight/900)`. When `s < 1`, give the overlay `width: 100vw/s; height: 100vh/s; transform: scale(s); transform-origin: 0 0`. This keeps every edge anchor and pixel value identical at any size.
- Add a vignette layer above the globe and under the HUD: `linear-gradient(180deg, rgba(6,10,20,.65) 0%, rgba(6,10,20,0) 22%, rgba(6,10,20,0) 72%, rgba(6,10,20,.7) 100%)`, with `pointer-events: none`.

| Region | Anchor | Size | File |
|---|---|---|---|
| Identity plate | top 14, left 14 | w 300 | `HudTop.jsx › IdentityPlate` |
| Clock + world control | top 14, centred | w 500 | `HudTop.jsx › WorldClock` |
| Treasury | top 14, right 14 | w 340 | `HudTop.jsx › Treasury` |
| Alert ribbon | top 178, centred | auto | `HudTop.jsx › AlertRibbon` |
| Standings | top 170, left 14 | w 300 | `HudSide.jsx › Standings` |
| Context panel | top 186, right 14, bottom 80 | w 340 | `HudSide.jsx › ContextPanel` + `HudPanes.jsx` |
| Dispatches / Chat | bottom 14, left 14 | w 380 | `HudBottom.jsx › Comms` |
| Hotbar | bottom 22, centred | 4 × 86×82, gap 14 | `HudBottom.jsx › Hotbar` |
| Globe controls | bottom 14, right 14 | w 340 | `HudBottom.jsx › GlobeControls` |
| Hover tooltip | cursor +18, +18 | min-w 160 | `HudBottom.jsx › HoverTip` |
| Toasts | top 186 (262 while an alert shows), centred, gap 8 | – | `MatchHud.jsx` |

Every panel uses the **Panel** component: background `--grad-panel` (`linear-gradient(180deg, rgba(29,43,74,.94), rgba(18,26,46,.94))`), `backdrop-filter: blur(8px)`, 1px border `rgba(124,196,255,.18)`, radius 14, shadow `0 8px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08)`.

The panel title is Barlow Condensed italic 800, 20px, uppercase, `.04em` letter-spacing, white, `text-shadow 0 2px 0 rgba(0,0,0,.35)`. A 5×16 gold tick (`--grad-gold`, radius 2, `skewX(-8deg)`, `0 2px 0 #a8721a`) sits 9px before the text, and the title has 12px margin-bottom.

Shared text style "Eyebrow": Rubik 600, 11px, uppercase, letter-spacing `.08em`, colour `#8a97b8` unless stated otherwise.

### 2.1 Identity plate (Panel, padding 12)
- **Avatar** 68×68, radius 12, `border: 2px solid <player colour>`.
  - Background: `radial-gradient(circle at 50% 30%, color-mix(in oklab, <colour> 40%, #0a0e1a), #0a0e1a 80%)`.
  - Shadow: `0 3px 0 rgba(0,0,0,.45), 0 0 20px color-mix(in oklab, <colour> 45%, transparent), inset 0 1px 0 rgba(255,255,255,.2)`.
  - Inside: the home country's **silhouette** as a 54px SVG, filled with the player colour, stroke `rgba(255,255,255,.7)` 1.5, `drop-shadow(0 2px 0 rgba(0,0,0,.45))`.
  - Silhouette algorithm: `hudShape()` in `MatchHud.jsx`. Take the outer rings from countries.geo.json. If the country crosses the antimeridian, shift negative longitudes by +360. Scale x by `cos(mean lat)`, then fit into a 92/100 box centred in a `0 0 100 100` viewBox.
- **Text column** (12px gap from the avatar):
  - Leader title: Eyebrow in `#ffd864`.
  - Leader name: Barlow Condensed italic 900, 30px, line-height .92, uppercase, white, with the display text-shadow. 4px margin-top; ellipsis on overflow.
  - Info line: 6px margin-top, Rubik 500 12px `#8a97b8`, gap 5. Gold star (`#f6c35a`), country name, `·`, `map-trifold` icon, "N lands".
- **Population row** (12px margin-top, gap 10):
  - Label row: `users-three` icon, then the value in Barlow italic 800 16px white (e.g. `10.6M`), then ` / 12.9M` (the cap).
  - Right side: `+1.0% / day` in `#9be8ab`, or `−1.5% / day` in `#ff9db1` when starving (Rubik 600 11px).
  - Under that, a Meter 7px high (spec in 2.13) in `#3cb44b`, or `#e6194b` when starving.
  - Then a Badge: `ready` + `grains` "Fed", or `danger` + `warning` "Starving".

### 2.2 Clock + world control
- **Clock row** (centred, gap 12, 10px margin-bottom):
  - **Ring** 42px, stroke 5. Track `#22304f` on a `rgba(6,10,20,.7)` fill. Arc `#f6c35a` with round caps, drawn as `1 − secondsLeft/tickSec`, animating `stroke-dashoffset` 1s linear. A `sun` icon (18px, `#ffd864`) sits in the centre.
  - **Day plate:** padding 7px 18px, radius 8, `--grad-gold`, `skewX(-8deg)`. Shadow `inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 #a8721a, 0 8px 18px rgba(0,0,0,.35)`. Text (counter-skewed): "Day 14" in Barlow italic 900 30px uppercase `#2a1c00`, letter-spacing .02em.
  - **Countdown:** a 70px column. "next day" in Rubik 500 12px `#8a97b8`, then `0:12` in Barlow italic 800 18px white.
- **World control** Panel (padding 10px 14px):
  - Header: "World control" as an Eyebrow in white; on the right, a `trophy` icon + "Victory at 60%" in Barlow italic 800 13px uppercase `#ffd864`.
  - Bar: 14px high, radius 999, `#060a14` with `inset 0 1px 2px rgba(0,0,0,.6)`. One segment per player, sorted by lands descending; width = `lands / 176`.
    - Segment fill: `linear-gradient(180deg, rgba(255,255,255,.4), transparent 60%), <colour>`, with `border-right: 2px solid #060a14`. The first segment gets the left radius.
    - Your own segment adds `inset 0 0 0 2px #fff`.
    - Victory marker at 60%: 3px wide, extending 5px above and below, `#ffd864`, glow `0 0 10px rgba(245,185,66,.9)`.
  - Footer (8px margin-top, Rubik 500 12px `#8a97b8`): left "You 4.0% · 7 lands" ("You" bold in your colour); right "Leader **<name in their colour>** 6.3%".

### 2.3 Treasury (Panel, padding 10)
- A 3-column grid with 6px gap, in this order: food, energy, minerals / gold, oil, research.
- **Cell:** gap 7, padding 6px 8px 6px 6px, radius 10, `#0f1526`, `inset 0 2px 0 rgba(0,0,0,.28)`.
  - Icon disc: 28px, `color-mix(in oklab, <res> 20%, transparent)`, holding a 16px Phosphor Fill icon in the resource colour.
  - Value: Barlow Condensed 700 20px, white, tabular numerals.
  - Delta: Rubik 600 11px, `#9be8ab` (positive) or `#ff9db1` (negative), e.g. `+86` followed by `/day` in muted 400.
  - When a stock is **≤ 0**: background `rgba(230,25,75,.12)`, `inset 0 0 0 1px #6e2338`, value in `#ff9db1`.
- **Power grid row** (9px margin-top, gap 8): `plug` icon 14 (`#f5d14e`, or `#ff9db1` below 100%), Eyebrow "Power grid", a 6px Meter (`#f5d14e` or `#e6194b`), then the % in Barlow italic 800 14px. The value is Economy `efficiency` (energy available ÷ demand, capped at 1).
- **Resource icons:** food `grains` #7bc86c · energy `lightning` #f5d14e · minerals `diamond` #9aa7bd · gold `coins` #f5b942 · oil `drop` #a885d8 · research `flask` #4fd1c5.

### 2.4 Alert ribbon (only while an alert is active)
- Pop-in: `iap-toast-in .3s cubic-bezier(.34,1.56,.64,1)`.
- **Ribbon:** padding 10px 14px 10px 10px, radius 10, `skewX(-8deg)`. Content is counter-skewed, gap 12.
  - **War:** `--grad-danger`, lip `#7a0c27`.
  - **Food:** `linear-gradient(180deg,#ff9f43,#e8731a 55%,#b4520c)`, lip `#6b3206`.
  - Shadow: `inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 <lip>, 0 12px 30px rgba(0,0,0,.45)`.
- **Contents:**
  - Icon box: 40px, radius 10, `rgba(0,0,0,.25)`, pulsing (`iap-pulse 1.2s`). White 24px `sword` or `bowl-food`.
  - Title: Barlow italic 900 22px uppercase white.
  - Body: Rubik 500 13px `rgba(255,255,255,.92)`.
  - Small button: War → `default` + `shield` "Defend" (selects the target country and opens Army mode). Food → `gold` + `grains` "Build farm" (selects the capital and opens Build mode).
- **Copy:**
  - War: "Invasion incoming" / "Kim Jong Un’s armor is marching on Finland · arrives Day 16".
  - Food: "Your people are starving" / "Population −1.5% per day until food returns".

### 2.5 Standings (Panel, padding 12)
- Title "Standings"; actions slot holds the Eyebrow "5 nations".
- Rows: gap 3, padding 7px 8px, radius 9, sorted by lands.
  - Your row: `rgba(79,209,197,.08)` + `inset 0 0 0 1px rgba(79,209,197,.3)`.
  - The row that owns the selected country: `rgba(255,255,255,.05)`.
- Row contents, left to right:
  - Rank: 18px wide, Barlow italic 900 22px. #1 is `#f6c35a` with text-shadow `0 2px 0 #6b460c`; the others are `#5a6b96`.
  - Colour bar: 6×30, radius 3, `skewX(-8deg)`, `inset 0 2px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.4)`.
  - Name: Rubik 600 14px white, with ellipsis.
  - Meta line (Rubik 400 11px, 2px margin-top): "You" (`#7fe6dc` 600) or the diplomacy state as icon + label in its colour, then `· 241M pop`, then `· AI` in `#f6c35a` for AI players.
  - Right column: lands in Barlow italic 800 20px; share % in Rubik 400 10px muted.
- **Diplomacy states:**

  | State | Icon | Colour | Badge kind |
  |---|---|---|---|
  | Allied | `handshake` | #9be8ab | ready |
  | At war | `sword` | #ff9db1 | danger |
  | Truce | `flag` | #7cc4ff | host |
  | Neutral | `minus-circle` | muted | default |

- Clicking a row selects that player's capital and focuses the globe on it.

### 2.6 Context panel
- Panel, padding 12, flex column. The title is the mode label; the actions slot holds a KeyCap.
- In Build and Army mode a **CountryHeader** comes first. The pane content then scrolls with 12px margin-top.
- **CountryHeader:** padding 12, radius 12, `rgba(6,10,20,.45)`, `inset 0 0 0 1px rgba(255,255,255,.05)`.
  - Silhouette: 46px, in the owner's colour, or `#4d6390` for neutral.
  - Name: Barlow italic 900 26px uppercase. A 16px gold `star` follows if it's a capital.
  - Owner line (Rubik 600 12px): a 9px swatch with radius 3, then "Yours" in `#7fe6dc`, or the owner name in white plus their diplomacy Badge. Neutral countries show "Neutral · garrison 8" in muted.
  - Stats: a 4-column grid with gap 10 and 12px margin-top, showing farmland, minerals, oil (icon 13 + Barlow italic 800 15px value + a 5px Meter scaled 0–100) and land slots (`squares-four` in `#7cc4ff`, "6/12", Meter `#3fa2ff`).

**Build mode, own country** (`BuildPane`):
- **Under construction:**
  - Rows contain a 30px Tile, the name (Rubik 600 13px), and on the right an `hourglass` icon + "Day 15" in muted.
  - Below each row, a 6px Meter in `#f6c35a` showing `(day − started) / (complete_at − started)`.
- **Active here:**
  - Shows wrapped chips (gap 6): padding 4px 9px 4px 4px, radius 999, `#0f1526`, well shadow.
  - Each chip holds a 20px Tile, the name and `×2`, in Rubik 600 12px.
- **Construct:** a 2-column grid with gap 8 showing all 8 buildings in this order: Farm, Mine, Oil Rig, Power Plant, Factory, Research Lab, Bank, Housing. The section head's right side reads "output for this land".
- **BuildTile:**
  - Box: padding 9, radius 10, `--grad-navy`, 1px `#27324f` border, `0 3px 0 #060a14, inset 0 1px 0 rgba(255,255,255,.06)`.
  - Hover: border `#4fd1c5`, adds `0 0 18px rgba(79,209,197,.45)` and `translateY(-1px)`.
  - Can't afford: opacity .5, `not-allowed`.
  - Top row: a 32px Tile, the name (Rubik 600 13px), and below it the yield in Barlow 700 12px. Produced resources use their own colour as `+34` plus the resource icon; consumed resources show `−18` in `#ff9db1`. Housing shows `+40M pop cap` in `#7cc4ff`.
  - Bottom row: cost at 11px (amounts you're short of turn `#ff9db1`), then `hourglass` "3d".
  - **Yield** = `produces × (scale ? attr / 50 : 1)`, matching the engine `Economy::step`.
- **Tile** (building icon square): `linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), <tone>`, radius = size/4, `inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)`, white glyph at 55% of size with `drop-shadow(0 2px 0 rgba(0,0,0,.3))`.
- **Building tones and icons:**

  | Building | Icon | Tone |
  |---|---|---|
  | Farm | `grains` | #7bc86c |
  | Mine | `hammer` | #5a6b96 |
  | Oil Rig | `gas-pump` | #a885d8 |
  | Power Plant | `lightning` | #d89a28 |
  | Factory | `factory` | #b5123a |
  | Research Lab | `flask` | #269b90 |
  | Bank | `bank` | #2a86f0 |
  | Housing | `house-line` | #2c8a38 |

**Build mode, not your country:** an empty note with a 34px `lock-simple` icon in `#5a6b96`, the title "Not your land" (Barlow italic 800 20px uppercase), the body "Conquer {country} to build farms, mines and power here." and a `danger` small button with `sword` "Plan attack" that switches to Army mode.

**Army mode, own country** (`ArmyPane`):
- **Forces here:**
  - The section head's right side shows "Strength 42" in Barlow italic 800 14px `#7fe6dc`. Strength = Σ count × attack.
  - Below it, 4 unit cards (grid, gap 6): padding 8px 4px, radius 10, `#0f1526`. Each card shows a 20px icon, the count in Barlow italic 900 20px and the name in Rubik 500 10px; units with a count of 0 are at .5 opacity.
- **Train:**
  - Each unit row has a 30px Tile in tone `#3a4a74`, the name, and "ATK n" in Barlow italic 800 12px `#ff9db1`.
  - Below that, the cost. On the right, a `primary` small button "×5" (disabled when you can't afford 5).
  - **Units:**

    | Unit | Icon | ATK | Cost | Build time |
    |---|---|---|---|---|
    | Infantry | `person-simple-run` | 1 | 40g 10m | 2d |
    | Armor | `truck` | 3 | 120g 60m 20oil | 4d |
    | Air Force | `airplane-tilt` | 5 | 200g 80m 40oil | 6d |
    | Navy | `boat` | 4 | 260g 120m 50oil | 7d |

- **Move forces:** one row per adjacent country (from `country_neighbors`).
  - Name in Rubik 600 13px.
  - Meta line in 11px:
    - Hostile: "Neutral · 42 vs 8 · 2d" in `#ff9db1` with a `danger` "Attack" button.
    - Own: "Yours · reinforce · 1d" in `#7fe6dc` with a `ghost` "Move" button.

**Army mode, not your country:**
- A box with padding 12, radius 12, `rgba(230,25,75,.08)`, `inset 0 0 0 1px #6e2338`.
- "Your strike force" vs "Defence" as Eyebrows over numbers in Barlow italic 900 40px (`#7fe6dc` / `#ff9db1`), with "VS" (22px, muted) between them.
- Outcome line (Rubik 500 12px): "Attacker wins if strength is higher. Expect ~19% losses." in green, or "Too strong. Train more units first." in red.
- A block `danger` button: "Attack from Sweden · 2 days".
- Combat rules come from `Combat.php`: defence is 8 for neutral, otherwise 4 plus the defenders' strength. The attacker wins if their strength is higher, with losses of `min(.9, def/atk)`.

**Trade mode** (`TradePane`):
- **Incoming offers** (the section head's right side holds a `gold` small `plus` "New offer" button).
  - Each offer is a card: padding 12, radius 12, `--grad-navy`, `#27324f` border, `0 3px 0 #060a14`.
  - Top: a 9px swatch and the sender's name (600 13px).
  - Middle: a `1fr auto 1fr` grid (gap 8, 10px vertical margin):
    - Left: "You get" (Eyebrow) and the resources as a ResLine (Barlow italic 800 18px with 16px icons).
    - Centre: a Bold `arrows-left-right` icon, 18px.
    - Right: "You give".
  - Bottom: two flex-1 buttons, `primary` `check` "Accept" and `ghost` "Decline".
  - When there are none: "No offers on the table."
- **Your offers:** rows with padding 10, radius 10, `#0f1526`, well shadow, reading "To {name}", then give → receive, then a Pill with `hourglass` "Pending".

**Diplomacy mode** (`DiplomacyPane`):
- One card per other player (same card style as trade offers):
  - A 6×32 skewed colour bar.
  - Name (600 14px) with the meta line "{title} · N lands · AI".
  - A state Badge.
  - 10px below, flex-1 small buttons for the actions available in that state:

| State | Actions |
|---|---|
| Neutral | Propose alliance (primary) · Declare war (danger) |
| Allied | Break alliance (ghost) |
| War | Offer truce (default) |
| Truce | Propose alliance (primary) · Declare war (danger) |

### 2.7 Dispatches / Chat (Panel, padding 12)
- **Header:** TabPlates "Dispatches" (`broadcast`) and "Chat" (`chats`, with an unread count bubble). In Chat, a scope toggle on the right switches between All and Allies:
  - Container: `#060a14`, padding 2, radius 999.
  - Buttons: padding 4px 10px, Rubik 600 11px uppercase, `.06em`. The active one is `#27324f` with white text.
- **List:** fixed height 150, scrolls. Dispatches renders `FeedEvent`s, newest first. Chat renders `ChatMessage`s and auto-scrolls to the bottom.
- **Composer** (chat only, 8px margin-top): a small Input and a small Button `paper-plane-right` "Send". The placeholder is "Message the world…" (all) or "Message your allies…" (allies). Enter sends. Typing must not trigger hotbar shortcuts.
- **TabPlates:** gap 6. Each tab has padding 6px 12px, radius 6 and `skewX(-8deg)`; the label is counter-skewed in Barlow italic 800 15px uppercase `.04em` with a 13px icon.
  - Active: `--grad-gold`, `inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 #a8721a`, text `#2a1c00`.
  - Inactive: `rgba(255,255,255,.06)`, `inset 0 0 0 1px #27324f`, muted text.
  - Count bubble: 16px high with radius 8, `#e6194b`, white Rubik 700 10px.
- **FeedEvent types (add these to the component):**

| Type | Icon | Colour |
|---|---|---|
| `war` | `sword` | #e6194b |
| `battle_repelled` | `shield` | #7cc4ff |
| `alliance` | `handshake` | #9be8ab |
| `trade` | `handshake` | #7fe6dc |

  These are in addition to conquest, build_complete, ai_build, player_defeated, match_ended and match_started.

### 2.8 Hotbar
- **Slots:** four buttons, 86×82, radius 14, 2px border, laid out as a flex column (centred, gap 6). Each holds:
  - a 30px icon with `drop-shadow(0 2px 0 rgba(0,0,0,.4))`,
  - the label in Barlow italic 800 15px uppercase `.04em`.

| State | Border | Background | Lift | Icon / label colour |
|---|---|---|---|---|
| Idle | `rgba(124,196,255,.22)` | `rgba(18,26,46,.88)` + blur 8 | 0 | white / `#b9c3db` |
| Hover | (idle) | (idle) | −3px | (idle) |
| Active | `#ffd864` | `linear-gradient(180deg,#2c4372,#19233b)` | −8px | `#ffd864` / white |

  - Base shadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 4px 0 #060a14, 0 10px 20px rgba(0,0,0,.4)`.
  - The active slot adds `0 0 0 3px rgba(245,185,66,.25), 0 0 26px rgba(245,185,66,.4)` in front of the base shadow.
  - Transition: `transform 150ms cubic-bezier(.34,1.56,.64,1)`.
- **KeyCap** at top −9, right −9: min-width 20, height 20, padding 0 5px, radius 5, `#060a14`, 1px `#3a4a74` border, `0 2px 0 #000`, Rubik 700 11px `#b9c3db`.
- **Count bubble** at top −8, left −8: 22px high, radius 11, `--grad-danger`, `0 2px 0 #7a0c27`, Rubik 700 12px white.
  - Trade shows the number of pending incoming offers.
  - Army shows "!" while you are under attack.

| Slot | Icon | Key |
|---|---|---|
| Build | `hammer` | B |
| Army | `sword` | A |
| Trade | `handshake` | T |
| Diplomacy | `flag-banner` | D |

### 2.9 Globe controls
- **Bar:** flex, gap 5, padding 6, radius 14, `rgba(18,26,46,.92)` + blur 8, 1px `rgba(124,196,255,.18)` border, panel shadow.
- **Contents, left to right:** 4 lens buttons, then a flex spacer, then zoom out (`minus`), zoom in (`plus`) and focus capital (`crosshair`).
- **RoundBtn:** 38×38, radius 10, 1px `#3a4a74` border, `--grad-navy`, `inset 0 1px 0 rgba(255,255,255,.1), 0 3px 0 #060a14`, 18px white icon. On press it moves `translateY(2px)` and the lip drops to 1px.
  - Active: border `#4fd1c5`, background `linear-gradient(180deg,#22485a,#173040)`, plus the teal glow. The icon turns the lens colour (or `#7fe6dc` for Political).
- **Lenses** (`flag-banner` Political, `grains` Farmland, `diamond` Minerals, `drop` Oil):
  - **Political:** territories in their owners' colours; the selected country in teal `#4fd1c5`.
  - **Resource lens:** every country is coloured `lerp(#1c2740 → hex, (attr/100)^0.8)` using three.js `Color.lerp`, and selection highlighting is hidden. Hexes: farmland `#7bc86c`, minerals `#c9d4ea`, oil `#a885d8`.
- **Zoom:** camera z ±0.35, clamped to 1.6–5.
- **Focus capital:** `globe.focus(capital)`.

### 2.10 Hover tooltip
- Follows the cursor at +18/+18, with `pointer-events: none`.
- Box: padding 9px 12px, radius 10, `rgba(10,14,26,.94)`, 1px `rgba(124,196,255,.18)` border, `0 8px 24px rgba(0,0,0,.5)`, min-width 160.
- Name: Barlow italic 900 19px uppercase.
- Owner line: Rubik 600 12px, a 9px swatch, then "Yours" (teal), the owner's name, or "Neutral" (muted).
- Attributes: farmland, minerals and oil in Barlow italic 800 14px with 12px icons. In a resource lens, the attributes that aren't active drop to .45 opacity.

### 2.11 Globe
- Use the new `globe.js`.
- Initial camera: z 2.6. On load, call `focus(capital)` and then clamp `_targetRotX` to at most 0.92 so northern capitals stay in view.
- Hover gets an emissive lift of `0x2a3f66`.
- Changes from the old globe:
  - Ocean `0x123a7a`, shininess 10, specular `0x1a3a6a`.
  - Neutral land `0x4d6390`.
  - Directional light 0.7, plus a `0x7cc4ff` rim light at 0.35.
  - Two atmosphere shells: radius 1.06 at opacity .14, and 1.14 at .06.

### 2.12 Toasts
- Uses the DS `Toast`.
- Auto-dismiss after 2.6s, with a 250ms fade.
- Copy:
  - "Farm started."
  - "Not enough resources."
  - "Training 5 infantry."
  - "Forces marching on Finland."
  - "Reinforcing Finland."
  - "Trade accepted."
  - "Offer declined."
  - "Alliance proposed to X."
  - "War declared on X."
  - "Truce offered to X."
  - "Alliance broken with X."

### 2.13 Meter (used everywhere)
- Track: radius 999, `#060a14`, `inset 0 1px 2px rgba(0,0,0,.6)`.
- Fill: `linear-gradient(180deg, rgba(255,255,255,.4), transparent 65%), <colour>`, animating width over `.5s cubic-bezier(.2,.8,.2,1)`.

---

## 3. Number formatting (new rule, use everywhere in the HUD)
`hudNum()` in `HudParts.jsx`:

| Range | Format | Examples |
|---|---|---|
| < 100 000 | Full number with a no-break space every three digits (`\u00a0`) | `2 410`, `99 999` |
| 100 000 – 999 999 | Rounded thousands + `K` | `100K`, `684K` |
| ≥ 1 000 000 | One decimal + `M` (no decimal once ≥ 100M) | `10.6M`, `241M` |
| ≥ 1 000 000 000 | Two decimals + `B` | `1.40B` |

Deltas are signed: `+86`, `−18` (U+2212 minus).

## 4. Interactions and keyboard
- Clicking the globe selects a country, and the context panel updates. Hovering shows the tooltip.
- Hotbar clicks or **B / A / T / D** switch the mode. Ignore the keys while an `<input>` has focus.
- Clicking a standings row selects that player's capital and focuses the globe on it.
- Alert ribbon buttons deep-link into the relevant mode and country (see 2.4).
- Clicking a build tile you can afford queues construction, shows a toast and adds the building to "Under construction". If you can't afford it, an error toast appears.
- The countdown ring and the seconds count down live from `next_tick_at` (20 s per day). When it reaches 0, the Day increments on the next poll or WebSocket `tick`.

## 5. State and data

The page polls `GET /api/match/get` every 3s, plus a WebSocket refresh, as `game.js` does today. Already available: players with stockpiles, pop and colour; territories; buildings; events; chat; `current_tick`.

**Backend additions the HUD needs** (the tables already exist in `db/schema.sql`):
- **`match/get` → `me`:** add `deltas` (per-resource change per tick, from a dry run of `Economy::step`), `efficiency`, `pop_cap`, `fed` (food_prod ≥ food_cons, or stock > 0), `next_tick_at` and `tick_interval_sec`.
- **Armies:**
  - `match/get` returns `armies[]`.
  - New endpoints: `POST /api/army/train` (`type`, `count`, `country_code`) and `POST /api/army/move` (`army_id`, `to`). Moves are limited to `country_neighbors`.
- **Trades:** `GET /api/trade/list`, `POST /api/trade/create` (`to_player`, `give`, `receive`), `POST /api/trade/respond` (`id`, `accept`). They emit `trade` events.
- **Diplomacy:** `POST /api/diplomacy/set` (`player`, `state`). `match/get` returns the pairs that involve you. War and alliance changes emit `war` / `alliance` events. Proposals may need a pending state if alliances require consent; this is a product decision.
- **Chat:** respect `scope` (`all` or `team`) on send and list. The UI label for `team` is "Allies".
- **Land slots:** count of buildings in a country vs `countries.land_slots`. Refuse building when the slots are full.
- **Alerts:**
  - War: any hostile army with `moving_to` ∈ your territories. Show the earliest arrival: "{leader}’s {unit} is marching on {country} · arrives Day {arrive_at_tick}".
  - Food: when the food stock reaches 0.

**Client state:** `mode`, `selectedCode`, `lens`, `hover`, `cursorPos`, `secondsLeft`, chat `tab` and `scope`, plus the polled match snapshot.

## 6. Design tokens
All tokens are in `design/tokens/*.css`. Use the variables and don't hard-code values. The ones the HUD uses most:

- **Navy:** 950 `#060a14`, 900 `#0a0e1a`, 850 `#0f1526`, 800 `#121a2e`, 750 `#19233b`, 700 `#22304f`, 600 `#27324f`, 500 `#3a4a74`, 400 `#5a6b96`, 300 `#8a97b8` (muted), 200 `#b9c3db`, 100 `#e6ebf5` (body).
- **Gold:** 300 `#ffd864`, 400 `#f6c35a`, 500 `#f5b942`, 700 `#a8721a` (lip), 900 `#2a1c00` (text on gold).
- **Teal:** 300 `#7fe6dc`, 400 `#4fd1c5` (selection/focus), 700 `#1a6f67`.
- **Sky:** 300 `#7cc4ff`, 400 `#3fa2ff`, 500 `#2a86f0`.
- **Red:** 300 `#ff9db1`, 500 `#e6194b`, 800 `#6e2338`.
- **Green:** 300 `#9be8ab`, 500 `#3cb44b`.
- **Gradients:**
  - `--grad-gold`: `#ffe066 → #f6c35a 48% → #d89a28`
  - `--grad-teal`: `#5fe3d6 → #37d0c2 48% → #269b90`
  - `--grad-navy`: `#26365a → #19233b`
  - `--grad-danger`: `#ff4d73 → #e6194b 55% → #b5123a`
- **Fonts:** display `'Barlow Condensed'` (italic 800/900, uppercase); body `'Rubik'` 400–700; numbers Barlow Condensed 700, tabular.
- **Radii:** 4, 9, 10, 12, 14, 16, 999.
- **Spacing:** HUD inset 14; panel padding 12 (HUD) / 16 (default).
- **Motion:** press 80ms; hover 150ms; pop `cubic-bezier(.34,1.56,.64,1)`; out `cubic-bezier(.2,.8,.2,1)`.
- **Skew:** `--skew: -8deg`. Always counter-skew the inner content.
- **Player slot colours:** keep `GameConfig::COLORS`. The mockup's own player uses `#42d4f4` (slot 6).

## 7. Assets
- **Icons:** Phosphor v2.1.1, Fill weight for game glyphs and Bold for utility (`arrows-left-right`, `caret-down`). **No emoji anywhere in the UI** (this replaces the emoji in `GameConfig::BUILDINGS['icon']`).
- **Fonts:** Barlow Condensed and Rubik, both OFL, bundled as woff2.
- **Country geometry and attributes:** `public/assets/countries.geo.json`, already in the repo. Silhouettes are generated from it at runtime.
- No raster images are used.

## 8. Files in this bundle
```
CLAUDE_CODE_PROMPTS.md            ← ordered prompts for Claude Code (phase 1: base HUD)
CLAUDE_CODE_PROMPTS_PHASE2.md     ← phase 2: rules v2, troops, strikes, research, tooltips
GAME_RULES.md                     ← authoritative game rules + formulas + schema changes
design/
  SKILL.md                        ← Claude Code skill entry (copy design/ to .claude/skills/iampresident-design)
  README.md                       ← design-system guide: voice, visual foundations, iconography, component index
  guidelines/*.html               ← foundation specimen cards (colours, type, spacing, brand)
  styles.css                      ← token + font + icon entry point
  tokens/  fonts/  assets/icons/phosphor/  assets/data/countries.geo.json
  components/<group>/<Name>.jsx   ← component specs (+ .d.ts props, .prompt.md usage)
  _ds_bundle.js                   ← compiled components (only to run the mockup)
  ui_kits/game/match-hud.html     ← OPEN THIS: the reference screen
  ui_kits/game/index.html         ← Home → Lobby → Match click-through (restyled current screens; see prompt 9)
  ui_kits/game/globe.js           ← drop-in replacement for public/js/globe.js
  ui_kits/game/data.js            ← leaders + building catalogue (mirrors GameConfig)
  ui_kits/game/hud/
    MatchHud.jsx   stage, globe wiring, lenses, keyboard, toasts, silhouette fn
    HudTop.jsx     IdentityPlate, WorldClock, Treasury, AlertRibbon
    HudSide.jsx    Standings, ContextPanel, CountryHeader, MODE_META
    HudPanes.jsx   BuildPane/BuildTile, ArmyPane, TradePane, DiplomacyPane
    HudBottom.jsx  Comms, Hotbar, GlobeControls, HoverTip
    HudParts.jsx   hudNum, Meter, Ring, Tile, Cost, KeyCap, Silhouette, TabPlates, DIPLO
    hudData.js     mock match state (shapes follow db/schema.sql)
    tweaks-panel.jsx  prototype-only, ignore
```

## 9. Acceptance checklist
- [ ] With `match-hud.html` and the implementation side by side at 1440×900, the two are indistinguishable for scenarios calm, invaded and starving.
- [ ] Every value in components.css traces back to `design/components/**/*.jsx`.
- [ ] Numbers follow §3, and no `.toFixed` K-formatting remains below 100 000.
- [ ] Hotbar keys work; the keys are ignored while typing in chat.
- [ ] Lenses recolour the globe; zoom and focus work.
- [ ] Globe land has no holes (subdivision) and no blown-out specular.
- [ ] No emoji remain in the UI.
