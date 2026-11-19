# Claude Code prompts: Match HUD + design system

Run these in order inside the `alexkv1/iampresident` repo. Each prompt is self-contained: paste it, let Claude Code finish, review, commit, then go to the next one.

## Setup (once)
1. Unzip so that `design_handoff_match_hud/` sits at the repo root.
2. Optional, recommended: install the design system as a Claude Code skill so it loads automatically in later sessions:
   ```bash
   mkdir -p .claude/skills && cp -R design_handoff_match_hud/design .claude/skills/iampresident-design
   ```
3. Add this block to the repo's `CLAUDE.md` (create the file if it doesn't exist):
   ```md
   ## Design system
   - The visual source of truth is `design_handoff_match_hud/design/` (tokens, components, mockups).
   - Read `design_handoff_match_hud/design/README.md` (design guide) and `design_handoff_match_hud/README.md` (HUD spec) before any UI work.
   - Copy pixel values exactly from `design/components/**/*.jsx` and `design/ui_kits/game/hud/*.jsx`. Never round to a 4/8px grid, never invent new colours; use the CSS variables from `design/tokens/`.
   - Icons are Phosphor (Fill for game glyphs, Bold for utility). No emoji in UI.
   - Numbers: full number with a no-break space every three digits (2 410) below 100 000, then K / M / B (see HUD spec §3).
   - Stack stays PHP + jQuery + three.js. No React, no bundler.
   ```

---

## Prompt 1: Read and plan
```
Read design_handoff_match_hud/README.md (HUD spec) and design_handoff_match_hud/design/README.md (design-system guide) in full. Then open design_handoff_match_hud/design/ui_kits/game/hud/*.jsx and design_handoff_match_hud/design/components/**/*.jsx to see the exact values.
Compare against the current public/pages/game/index.php, public/js/game.js, public/js/globe.js and public/css/app.css.
Write a step-by-step implementation plan to docs/hud-plan.md covering: CSS files to add, components to port, which jQuery render functions to create, backend endpoints and DB changes, and anything ambiguous. Don't write code yet. List open questions at the end.
```

## Prompt 2: Install tokens, fonts and icons
```
Follow §1 of design_handoff_match_hud/README.md:
- Copy design/tokens/*.css to public/css/tokens/, design/fonts/*.woff2 to public/fonts/, and design/assets/icons/phosphor/* to public/css/phosphor/. Fix every url() so the paths resolve.
- Create public/css/styles.css containing only @import lines (tokens, then phosphor fill.css + bold.css). It must not contain any rules.
- Link /css/styles.css on the home, lobby and game pages, before app.css. Keep app.css for now.
- Verify in the browser that Barlow Condensed, Rubik and the Phosphor glyphs load (no 404s in the network tab).
```

## Prompt 3: Port the design-system components to CSS
```
Create public/css/components.css and public/js/ui-kit.js.
For each component in design_handoff_match_hud/design/components/** (Button, Badge, Pill, Icon, Input, Field, Card, Panel, Wordmark, ResourceChip, CountryTag, PlayerRow, BuildItem, FeedEvent, ChatMessage, Toast, Spinner, ModeCard), port it to:
- a CSS class family with BEM-style modifiers. Every value (padding, radius, border, gradient, box-shadow, font shorthand, letter-spacing, transitions) must be copied exactly from the .jsx inline styles. JS hover/press state becomes :hover and :active, e.g. Button press = translateY(3px) with the lip shrinking to 1px over 80ms.
- a small jQuery helper in ui-kit.js that returns markup, e.g. UI.button({variant:'gold', icon:'play', label:'Start match'}). Read <Name>.d.ts for the props and <Name>.prompt.md for usage.
Add FeedEvent types war / battle_repelled / alliance / trade (spec §2.7).
Then build public/dev/components.php, which renders every variant shown in design/components/*/*.card.html. Open both side by side and fix any difference until they match.
```

## Prompt 4: Replace the globe
```
Replace public/js/globe.js with design_handoff_match_hud/design/ui_kits/game/globe.js. It has the same public API, plus destroy(), triangle subdivision and the new palette.
Check that lobby.js and game.js still work. Big countries (Canada, Russia, Greenland) must render solid, with no ocean showing through, and there must be no bright specular hotspot.
Then add what the HUD needs (spec §2.9, §2.11):
- globe.setZoom(delta) clamped to 1.6–5;
- initial camera z 2.6;
- focus(code) clamps rotX to ≤ 0.92;
- resource lenses that colour every country lerp(#1c2740 → resourceHex, (attr/100)^0.8) using THREE.Color.lerp.
```

## Prompt 5: Backend for the new HUD
```
Implement §5 of design_handoff_match_hud/README.md in PHP, following the existing patterns in public/api/* and utils/engine/*:
1. /api/match/get: add to `me` the fields deltas (per resource, from a dry run of Economy::step with no writes), efficiency, pop_cap, fed, next_tick_at, tick_interval_sec. Also return armies[], diplomacy pairs involving me, pending trades involving me, and land-slot usage per country.
2. POST /api/army/train {type,count,country_code}: validate the cost against GameConfig::UNITS and deduct it.
3. POST /api/army/move {army_id,to}: `to` must be in country_neighbors. Set moving_to and arrive_at_tick (2 ticks if hostile, 1 if own).
4. GET /api/trade/list, POST /api/trade/create {to_player,give,receive}, POST /api/trade/respond {id,accept}: transfer resources atomically and emit a 'trade' event.
5. POST /api/diplomacy/set {player,state}: emit 'war' / 'alliance' events. Ask me before deciding whether alliances need the other side to accept.
6. Chat: respect scope 'all' | 'team' on send and list.
7. Build::start: refuse when the country's buildings >= countries.land_slots.
Extend worker/smoke_test.php to cover train, move/conquer, trade and diplomacy. Run it.
```

## Prompt 6: Build the HUD layout (static)
```
Rebuild public/pages/game/index.php to match design_handoff_match_hud/design/ui_kits/game/match-hud.html.
- Structure: full-viewport #globe, then the vignette layer, then a fixed .hud overlay that scales to fit (spec §2), containing the regions in the §2 table: identity plate, world clock, treasury, alert ribbon, standings, context panel, comms, hotbar, globe controls, hover tooltip and toast stack.
- Put the region styles in public/css/hud.css, using the exact values from spec §2.1–§2.13 and hud/*.jsx. Reuse components.css classes everywhere a design-system component is used.
- Create public/js/hud/{top,side,panes,bottom,format}.js with render functions that mirror the JSX files one to one. format.js implements hudNum() exactly as in spec §3.
- First render it with the mock state from design/ui_kits/game/hud/hudData.js (copy it to public/js/hud/mock.js behind ?mock=1).
- Open the mockup and /game?mock=1 at 1440×900 and make them match. Check all three alert states: calm, invaded, starving.
```

## Prompt 7: Wire live data and interactions
```
Replace the mock with real data in public/js/game.js:
- Polling: every 3s plus the WebSocket refresh, as today.
- Countdown: from next_tick_at.
- Hotbar: B/A/T/D shortcuts, ignored while an input has focus.
- Selection: globe click selects a country; standings click selects that player's capital and focuses it.
- Context panel modes: build queue → /api/build/queue; train/move → army endpoints; accept/decline/create → trade endpoints; diplomacy actions.
- Alert ribbon rules from spec §5.
- Chat tabs: All / Allies.
- Lenses, zoom and focus capital.
- Toasts: use the exact copy in spec §2.12.
Remove every emoji from the game UI and from GameConfig::BUILDINGS['icon'] (use the Phosphor names from spec §2.6).
```

## Prompt 8: Visual QA against the mockup
```
Serve design_handoff_match_hud/design statically and the game locally. At a 1440×900 viewport, take screenshots of the mockup and of /game?mock=1 for each of the 3 alert states (calm, invaded, starving) and each of the 4 hotbar modes. Use Playwright if it's available; otherwise describe the differences region by region.
For each difference, fix the implementation, not the mockup. Then run through the acceptance checklist in §9 of the README and report each item as pass or fail.
Finally, delete app.css rules that are no longer used.
```

## Prompt 9 (optional): Restyle Home and Lobby
```
Using design_handoff_match_hud/design/ui_kits/game/index.html (HomeScreen.jsx, LobbyScreen.jsx) as the reference, restyle public/pages/home and public/pages/lobby with components.css. Copy and behaviour stay as they are today. Match the reference visually at 1440×900.
```
