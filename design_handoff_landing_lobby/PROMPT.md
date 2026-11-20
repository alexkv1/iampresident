You're implementing a new landing page, matchmaking search screen and lobby restyle for the I Am President game in this repo (PHP 8.4 pages + vanilla JS/jQuery + three.js globe).

The full spec is in `design_handoff_landing_lobby/README.md`. Read it end to end before writing any code. Then read `design_handoff_landing_lobby/prototype/Landing Page.dc.html` (only the sections with id `1c`, `2a`, `2b`, `2c` — ignore 1a/1b) and the component sources in `design_handoff_landing_lobby/reference/components/`. Those files are the source of truth for every pixel value; the README tells you which parts matter and how they behave.

Rules:
- Recreate the designs in the existing stack. No React, no build step, no new frameworks. Port the inline styles and the React component styles to plain CSS classes in `public/css/`, restyling existing class names in place (`.btn`, `.panel`, `.input`, `.player-row`, etc.) so the game page keeps working.
- Follow the setup steps in the README first: tokens, fonts, Phosphor icons, the new `globe.js`, and scoping `body { overflow:hidden }` away from the home page.
- Copy is final. Use it verbatim.
- Keep existing API contracts. If an endpoint's response shape differs from what the README or fixtures assume, read the PHP and adapt — don't change backend behavior unless the README says to.
- Implement the `vt=1` test hooks exactly as specified in the README's "Visual testing" section. They must be inert without `vt=1`.

Order of work:
1. Setup (tokens, fonts, icons, globe.js, CSS component classes). Smoke-test `/game` still renders.
2. Landing page (1c) incl. Match dropdown + Take office behavior.
3. Search overlay (2a), driven by real API calls with the minimum durations from the README.
4. Lobby restyle (2b) and host view (2c), incl. auto-claim from `?claim=`, arrival toast, Invite friends panel, join toasts, invite links (`/?code=`).

Visual testing — this is how you know you're done:
- `cd design_handoff_landing_lobby/visual && npm install && npx playwright install chromium`
- Terminal A: `npm run serve:proto`. Then `npm run capture` once to generate `reference/`.
- Terminal B: run the app (`php -S 127.0.0.1:8000 -t public public/router.php` from the repo root; adjust if needed).
- After each screen, run `IMPL_URL=http://127.0.0.1:8000 npm run compare` (or `npm run compare -- <state-name>` for one state).
- Open and actually look at every `out/side/<state>.png` (reference | yours | diff). Check font family/weight/italic/size, letter-spacing, uppercase, spacing, colors, shadows/lips, radii, skew. Fix and re-run. Don't stop at "close enough" numbers if the side-by-side shows a visible difference.
- Also eyeball `reference/full/*.png` for globe size, position and selection colors (the diff masks canvases).
- Done = every state in `states.mjs` passes (≤1.5% diff, landing height within 4px) AND the side-by-sides look identical.

Finally, without `vt=1`, manually exercise: Join random match (with open matches and with none), Host private room, Join private room with a valid code, an empty code, and a bad code, claiming a country that's already taken, Copy code / Copy invite link, and opening an invite link. Confirm the game page still works.

When finished, give me: a list of changed files, the final `compare` table, and anything you had to decide that the README marked as "not designed" or open.
