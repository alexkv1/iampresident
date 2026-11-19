# I Am President — Design System

**I Am President** is a realtime multiplayer browser strategy game. You spin a 3D globe, take control of a real country *as its current real-world leader* (pick North Korea → you are Supreme Leader Kim Jong Un), then feed your people, mine resources, trade, build an army and try to dominate the world: online against strangers, in a private room with friends, or solo against AI nations.

This design system gives the game a **stylised, Fortnite-adjacent game look**: chunky, glossy and confident without being cartoonish or pixelated. It is built on top of the structure, copy, data and tokens in the game's codebase. The codebase's own visuals are an explicitly provisional skeleton theme ("visuals are intentionally provisional and meant to be restyled"), so this system keeps the codebase's **layout, components, copy, resource/player colours and spacing values** and adds a **game skin**: display type, gradients, 3D "lip" buttons and brighter globe colours.

## Sources

- **GitHub:** https://github.com/alexkv1/iampresident (branch `main`). Explore it for engine rules, API shapes and screen logic before designing new features.
  - `public/css/app.css`: skeleton theme tokens, radii, spacing and component classes (source of the component inventory)
  - `public/pages/{home,lobby,game}/index.php` + `public/js/{home,lobby,game,ui,globe}.js`: the three screens
  - `utils/engine/GameConfig.php`: resources, building catalogue, units, player slot colours
  - `db/seeds/leaders.sql`: leader names and titles used for in-match personas
  - `public/assets/countries.geo.json`: copied to `assets/data/countries.geo.json`
- No Figma file, slide deck, logo or brand guide was provided.

## Products / surfaces

There is one product: the **web game client**, with three screens:
1. **Home**: name entry, mode picker (Play Online / Private Room / Single Player), join by room code, open matches list.
2. **Lobby**: full-screen auto-rotating globe; Players panel; Your nation panel (Ready up / Start match); hover country tag.
3. **Match**: globe plus HUD: top bar (leader persona, Day counter, six resource chips, Exit); World standings; Build catalogue; Dispatches (event feed and chat); hover country tag.

---

## Index

| Path | What |
|---|---|
| `styles.css` | Entry point. `@import`s only. Link this one file. |
| `tokens/colors.css` | Navy/sky/gold/teal ramps, semantic aliases, resources, player slots, globe, gradients |
| `tokens/typography.css` | Font stacks, display + UI scales, semantic `--type-*` shorthands |
| `tokens/spacing.css` | Spacing, HUD layout constants, radii, shadows/lips, motion |
| `tokens/base.css` | Element defaults + shared keyframes |
| `tokens/fonts.css` | `@font-face` for Barlow Condensed + Rubik (local woff2 in `fonts/`) |
| `assets/icons/phosphor/` | Phosphor Fill + Bold icon fonts (local) |
| `assets/data/countries.geo.json` | Country geometry + gameplay attributes (from repo) |
| `components/` | React primitives (see below) |
| `guidelines/` | Foundation specimen cards (Colors, Type, Spacing, Brand) |
| `ui_kits/game/` | Click-through recreation of Home → Lobby → Match |
| `thumbnail.html` | Project tile |
| `SKILL.md` | Agent-skill entry point |

### Components

All components live under `components/<group>/` with `.jsx`, `.d.ts`, `.prompt.md` and one card per directory.

- **core**: `Button`, `Icon`, `Badge`, `Pill`
- **forms**: `Input`, `Field`
- **surfaces**: `Card`, `Panel`
- **brand**: `Wordmark`
- **hud**: `ResourceChip`, `CountryTag`
- **players**: `PlayerRow`
- **build**: `BuildItem`
- **feed**: `FeedEvent`, `ChatMessage`
- **feedback**: `Toast`, `Spinner`
- **home**: `ModeCard`

Each one maps to a class family in `public/css/app.css`: `.btn*` → Button, `.input`/`label.field` → Input/Field, `.card` → Card, `.panel` → Panel, `.pill` → Pill, `.badge` → Badge, `.res` → ResourceChip, `.country-tag` → CountryTag, `.player-row` → PlayerRow, `.build-item` → BuildItem, `.feed .ev` → FeedEvent, `.chat-msgs .m` → ChatMessage, `.toast` → Toast, `.spinner` → Spinner, `.mode-card` → ModeCard, `.brand` → Wordmark.

**Intentional additions**
- `Icon`: thin wrapper for the Phosphor icon font, which replaces the codebase's emoji placeholders.

### UI kits
- `ui_kits/game/`: Home, Lobby and Match screens. Interactive: create or join a match, pick a country on the real 3D globe, ready up, start, then build, chat and watch ticks. Deep-link with `#lobby` or `#game`.

---

## Content fundamentals

**Voice.** Short, punchy and slightly tongue-in-cheek power fantasy. The game talks to the player as a head of state: "Lead a nation. Feed your people. Dominate the world." Copy is plain and functional; the drama comes from the verbs (*lead, conquer, dominate, eliminated*), not adjectives.

**Person.** Second person: "Your nation", "Your name", "click your land to build", "You are now Prime Minister Ulf Kristersson of Sweden". "I" appears only in the brand name, which is the player's own boast.

**Casing.** Sentence case in source strings ("World standings", "Start match", "Ready up", "Open matches"). Display type then renders titles, buttons, pills and badges in UPPERCASE through CSS, so **write sentence case and let the component uppercase**. Body copy, toasts, hints and feed lines stay sentence case.

**Patterns (verbatim from the codebase)**
- Taglines: imperative triplets. "Lead a nation. Feed your people. Dominate the world."
- Mode descriptions: one short sentence. "Create a public match strangers can join." · "Get a code to play with friends." · "Play solo against the computer (3 AI nations)."
- Hints use middle dots: "Drag to rotate · scroll to zoom · click a country to claim it". Meta lines do too: "3/8 players · 20s/tick", "12 territories · 51.7M pop".
- Toasts are terse and end with a period: "Farm started." · "Not enough resources." · "Enter a room code."
- Feed lines lead with the bolded leader: "**Kim Jong Un** conquered Republic of Korea" · "**X** has been eliminated" · "**X** dominates the world!" · "The match has begun."
- Empty states are friendly and nudge action: "No open matches right now — start one!"
- Placeholders use an ellipsis character: "President…", "Message the world…", "Choosing country…".

**Leaders and politics.** Players adopt real leaders with real titles ("Supreme Leader", "Prime Minister", "King", "Emir"). Titles and names come from `leaders.sql`. Countries without a seeded leader fall back to "President of &lt;Country&gt;". Keep copy neutral: never editorialise about real people or countries. The humour comes from the premise, not from jokes at anyone's expense.

**Time and numbers.** One tick is one in-game **Day** ("Day 14", "3 days" to build). Large numbers are compacted (`12.3K`, `1.23M`, `2.10B`, as in `UI.num`). Resource names are Food, Energy, Minerals, Gold, Oil, Research.

**Emoji.** The skeleton uses emoji as stand-in icons (🌍 🌐 🔒 🤖 🌾 ⚡ ⛏️ 💰 🛢️ 🔬 ☠ 🏆 ⏳). **The design system replaces every one with a Phosphor icon.** Don't put emoji in UI or chrome. Players may still type them in chat.

---

## Visual foundations

**Overall vibe.** "Stylised game plastic": confident navy night-sky surfaces, glossy vertical gradients, chunky 3D buttons that physically press, heavy italic condensed caps, and saturated accent colours that read at a glance. It is more grown-up than a mobile cartoon game and less gritty than a realistic shooter. The 3D globe is always the hero; UI floats over it.

**Colour**
- *Navy* (`--navy-*`) is the ground: page `#0a0e1a`, cards `#121a2e`, raised `#19233b`, borders `#27324f`, muted text `#8a97b8`, body text `#e6ebf5`. These values are the codebase's own.
- *Sky* blue (`--sky-*`) adds lobby atmosphere: page radial glow, hero card, globe halo, Host badge.
- *Gold* (`--gold-*`) is the **hero CTA** (Start match, Single Player, Day plate, wordmark, victory). Use one gold action per screen.
- *Teal* (`--teal-*`) means **selection and "you"**: selected country, focus ring, hovered build item, your own row, the Ready state.
- *Resources* use fixed hue + icon pairs (food green, energy yellow, minerals steel, gold amber, oil violet, research teal). Never swap them.
- *Player slots* use the 12 `GameConfig::COLORS`. They paint territories, swatches and chat names, and never appear as UI chrome.
- Semantic: red `#e6194b` for danger and conquest, green `#3cb44b` for ready and success. Both come with dark tinted backgrounds and light text (`#ff9db1`, `#9be8ab`).

**Type**
- Display: **Barlow Condensed**, italic 800–900, uppercase, tight leading (0.86–0.95), with a hard drop shadow (`0 2px 0 rgba(0,0,0,.35)`). Used for titles, panel headers, buttons, badges, pills, HUD numbers and country names.
- Body: **Rubik** 400–700, used for descriptions, labels, chat, feed and inputs. UI sizes are the codebase's exact steps: 17/16/15/14/13/12/11/10px.
- Numbers: Barlow Condensed 700 with tabular figures (`--type-hud-value`).

**Backgrounds.** No photography. Menu screens use `--grad-hero` (a blue glow rising from the bottom) under a faint 135° stripe texture (`--pattern-stripes`, 3.5% white). In-game, the WebGL globe fills the viewport over `--grad-page`, a radial sky glow at the top right fading to navy. There are no full-bleed images and no hand-drawn illustration. The globe is the imagery.

**Gradients.** Always vertical, light at the top and dark at the bottom (`180deg`). This gives the "plastic" sheen on buttons, tiles, plates and panels. Avoid diagonal rainbow or blue-to-purple washes.

**Borders.** 1px on surfaces (`--navy-600`, or `--border-glow` sky at 18% on overlays). Inputs use 2px. Hover swaps the border to teal.

**Shadows and elevation**
1. *Lip*: a solid, unblurred offset under every pressable element (`0 4px 0 <darker shade>`) plus an inner top highlight (`inset 0 2px 0 rgba(255,255,255,.45)`). This is the main game motif.
2. *Float*: overlays and cards use `--shadow-panel` (`0 8px 30px rgba(0,0,0,.45)`) plus a 1px inner sheen.
3. *Well*: inputs and resource chips are sunken (`inset 0 2px 0 rgba(0,0,0,.28)`).
4. *Glow*: teal or gold outer glow, only on hover or focus.

**Corner radii** (from the codebase): 4 swatch · 9 row · 10 control/button/input/build item · 12 country tag · 14 panel/mode card · 16 card · 999 pill/chip. Nothing is perfectly square, and nothing is blob-round except pills.

**Skew.** `--skew: -8deg` turns the Day plate, panel-title ticks and the slanted hero button into parallelograms. Inner content is counter-skewed so text stays upright. Use it sparingly: about one skewed element per region.

**Transparency and blur.** Only HUD overlays (Panel, CountryTag) are translucent: `rgba(18,26,46,.92)` with `backdrop-filter: blur(8px)`, so the globe ghosts through. Menu cards are opaque.

**Layout.** The HUD is fixed and inset 14px from every edge: top bar (min-height 56) across the top; left column 270px (players and standings) and right column 300px (nation and build), both starting at top 86px; bottom-left Dispatches panel 360px wide; country tag at bottom-right; hint text at bottom-centre. Menus centre one 560px column.

**Hover and press**
- Hover: lift −1 to −2px, `brightness(1.08)`, border turns teal, glow appears.
- Press: move down 3px while the lip shrinks from 4px to 1px, so the button "sinks". Transition 80ms.
- Ghost buttons: hover adds a 6% white wash. Disabled: 45–50% opacity, no lift.
- Globe: hovered countries get an emissive blue lift. The selected country turns teal and the cursor becomes a pointer.

**Motion.** Quick and physical. Press 80ms; hover and border 150ms; toasts pop in over 200ms on `--ease-pop` (slight overshoot) and fade out over 250ms after 2.6s. Construction status pulses. The lobby globe auto-spins slowly; focusing a country eases 8% per frame. There are no long page transitions.

**Cards.** Menu Card: navy gradient, 1px border, 16px radius, float shadow, 26px padding. The `hero` tone adds a sky tint and an outer blue glow. HUD Panel: translucent and blurred, 14px radius, 16px padding, and an uppercase italic title with a skewed gold tick. No coloured left-border cards.

---

## Iconography

- **System:** [Phosphor Icons](https://phosphoricons.com) v2.1.1, stored locally as icon fonts in `assets/icons/phosphor/` (`fill.css` and `bold.css`, both imported by `styles.css`). Use `<i class="ph-fill ph-coins">` or the `Icon` component.
- **Weights:** *Fill* for anything game-world (resources, buildings, modes, feed events, badges, buttons), because solid glyphs match the chunky style. *Bold* is only for small utility glyphs (input adornments, carets, search, send).
- **Tiles:** building and mode icons sit in a rounded tile with the tone colour, a vertical gloss overlay, a white glyph with a 2px drop shadow and a 3px lip.
- **Canonical mapping** (replaces the codebase emoji): food `grains` · energy `lightning` · minerals `diamond` · gold `coins` · oil `drop` · research `flask` · Farm `grains` · Mine `hammer` · Oil Rig `gas-pump` · Power Plant `lightning` · Factory `factory` · Research Lab `flask` · Bank `bank` · Housing `house-line` · Online `globe-hemisphere-west` · Private `lock-key` · Single `robot` · conquest `sword` · eliminated `skull` · win `trophy` · build done `check-circle` · building `hourglass` · territories `map-trifold` · population `users-three` · Day `sun`.
- **Substitution flag:** the codebase has no icon assets and uses emoji. Phosphor is a substitute chosen for its Fill weight. There are no PNG icons, no SVG sprite and no Unicode-glyph icons.
- **Logo:** none exists in the sources. `Wordmark` sets the name in display type. Don't draw a logo or mark.

## Fonts: substitution flag

The codebase uses system "Segoe UI". For the game look, this system ships **Barlow Condensed** (display, a stand-in for the heavy condensed "Burbank-style" game header face) and **Rubik** (body) from Google Fonts, stored locally in `fonts/`. If the team licenses a proprietary display face, swap it in `tokens/typography.css` (`--font-display`) and `tokens/fonts.css`.
