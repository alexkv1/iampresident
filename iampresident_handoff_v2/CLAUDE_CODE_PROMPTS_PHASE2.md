# Claude Code prompts, phase 2: realistic war, tooltips and research

Run these **after** Prompt 8 of `CLAUDE_CODE_PROMPTS.md` (or right after Prompt 4 if you haven't built the backend yet; in that case merge Prompt 5 into P2-2).

Each prompt is self-contained: paste it, review, commit, say "next".

**Sources of truth:**
- `GAME_RULES.md`: every rule, formula and constant.
- `design/ui_kits/game/match-hud.html` + `hud/*.jsx`: the UI and interactions. The `hudGeo.js` / `MatchHud.jsx` logic is a client-side illustration of the rules; the server must own all of it.
- `design/components/feedback/Tooltip.*`: the new design-system component.

---

## P2-1: Read, plan, migrate
```
Read iampresident_handoff_v2/GAME_RULES.md in full, then the README section "Phase 2" and design/ui_kits/game/README.md ("Troops, routes and fog of war").
Open match-hud.html in a browser and try each of these:
- Army mode on Germany, China, Russia and South Korea,
- Research mode,
- Diplomacy,
- hover tooltips,
- the "Invaded" scenario.
Then:
1. Write docs/rules-v2-plan.md: map every section of GAME_RULES.md to the PHP files and functions you'll touch (GameConfig, Combat, Diplomacy, Tick, Economy, Build, new Movement.php, Research.php, Strike.php, Occupation.php, Vision.php), plus the API endpoints and HUD files.
2. Write db/migrations/002_rules_v2.sql implementing §12 exactly (ALTERs plus the two new tables). Make it idempotent.
3. Extend worker/gen_countries.js to compute area_km2 (geodesic), coastal (any ring edge not shared with another country) and centroid lon/lat with the same overrides as hudGeo.js. Add a terrain map from §3. Regenerate the seeds.
4. Move every constant from GAME_RULES.md into GameConfig.php (UNITS with attack/defence/speed/upkeep/capacity, TECH, STRIKES, GARRISON, OCCUPATION, TRUCE_DAYS, MANPOWER_RATE, VICTORY_WEIGHTS…).
Don't change gameplay code yet. Run the migration locally and stop. List open questions.
```

## P2-2: Movement, combat, garrisons (§2–4)
```
Implement GAME_RULES.md §2–§4 in PHP:
- Movement.php: centroid distance, pathKm with a 1.2 road factor, shortest land path with BFS over country_neighbors (passable = own lands or players who granted you access), sea route (both ends coastal, navy capacity 10 per ship, ×1.3 distance, 900 km/day), stack speed = slowest unit, days = ceil(km/speed).
- POST /api/army/move {army_id, target, kind} validates everything above plus §7 (must be at war with the owner, not in a truce). Store path, kind, depart_tick, arrive_at_tick, origin. Return a clear error message for each refusal; use the same wording as the mockup's RouteRow reasons.
- Combat.php: rewrite resolveArrivals with the §3 formulas (defender ×1.5, terrain, amphibious ×0.75, U(0.85,1.15) on each side, losses for both sides, survivors return to origin). Garrison per §4 (neutral formula, owned militia 50%, occupied 0, minus damage, recovering 10%/day).
- Expose GET /api/army/plan?target=XXX, which returns exactly the data the Army pane needs: invade options (land/sea with ok, reason, blockers, km, days, strength, odds) and strike options. Calculate the odds server-side on the 40×40 grid like winChance() in MatchHud.jsx.
Extend worker/smoke_test.php: land move through access, blocked by a neutral country, sea capacity refusal, landlocked target, defender bonus, terrain, deterministic combat with a seeded RNG. Run it.
```

## P2-3: Economy of war (§1, §5)
```
Implement GAME_RULES.md §1 and §5:
- Daily upkeep per unit, charged in Tick before production. Desertion at 5% when gold or food is short; ground armor, navy and air when oil is short (block move and strike, emit grounded_no_oil).
- Manpower limit = 1% of population; /api/army/train refuses past the limit.
- Training per §1a: batches of 5, a `training` table, slots = 1 + active Factories per country (0 while occupied), ready on ready_tick with a training_complete event. Show the queue and slots in the Army pane exactly as HudArmies.jsx does.
- Starting stockpiles and starting armies scaled by s = clamp(√(gdp_md/500000), 0.6, 3.0) in MatchSetup.
- Weighted victory score (0.4 pop + 0.3 area + 0.3 GDP shares), 60% to win. match/get returns each player's `share`.
- match/get → me: add manpower {used, limit} and upkeep {gold, food, oil} totals. Treasury deltas must include upkeep.
Add smoke tests and run them.
```

## P2-4: Occupation and diplomacy (§6–7)
```
Implement GAME_RULES.md §6 and §7:
- Occupation: occupied_until = conquest tick + 10; 50% building output; militia 0; unrest +8 / −10 / +2 per day; revolt at 100 (back to the previous owner if alive, otherwise neutral, with a full garrison); integrated event after 10 days.
- Diplomacy: the diplomacy_proposals table, with POST /api/diplomacy/propose {player, type: alliance|truce|access}, POST /api/diplomacy/respond {id, accept} and POST /api/diplomacy/declare-war {player}. Proposals expire after 3 ticks; AI answers on its tick (accept an alliance if it isn't at war with you and you share an enemy; accept a truce if it's losing; grant access to allies).
- Truce: 10 ticks, unbreakable. Block move, strike and declare-war until truce_until.
- Allies share vision. Access is directional and separate from alliance.
Add smoke tests and run them.
```

## P2-5: Research and strikes (§8–9)
```
Implement GAME_RULES.md §8 and §9:
- Research.php: one active project per player; research points and gold are paid at the start; progress per tick; requirements, including "5 Research Labs" for nukes. Endpoints: GET /api/research/list, POST /api/research/start {key}. Emit research_started and research_complete.
- Arsenal: build missiles per tier and warheads (10 ticks, max 1 in production). The Build mode shows Missile items once unlocked; stock appears in the Army pane.
- Strike.php: POST /api/strike {kind, target, from?}. Validate tech, range (km from the stack or capital), cooldown (1 tick per stack for artillery and air), cost (minerals per gun, oil per plane, missile stock), and war/truce rules. Damage order: units first (cheapest by defence), then the garrison via territories.damage. Air losses are 5% when the target's base garrison is above 20.
- Nuclear strike: destroy all units and buildings; kill 40% of the population; ruined_until = +20 (farm output 0); every other nation may declare war immediately (AI does unless allied); immediate retaliation by any target-side warhead holder (AI fires automatically; a human gets a "Retaliate?" prompt event for 1 tick). Emit nuclear_strike with a world-wide alert.
Add smoke tests for each strike kind, range refusal, cooldown, nuke consequences and retaliation. Run them.
```

## P2-6: Fog of war, server-enforced (§10)
```
Implement Vision.php per GAME_RULES.md §10: own lands + allied lands + stack locations (origin and destination for stacks in transit) + one border beyond.
/api/match/get must strip every enemy army outside the requester's vision and must return `defence: null` for fogged enemy countries. Neutral garrisons are always returned.
Add a test proving hidden stacks never appear in the JSON for a player who shouldn't see them.
```

## P2-7: HUD: troops, routes, strikes, research, diplomacy, tooltips
```
Port the new UI from design/ui_kits/game/hud/ into public/js/hud/ + public/css/hud.css with exact values, as in step 6:
- globe.js: replace it with design/ui_kits/game/globe.js (adds projectLocal, addPath, removePath, lonLatVec).
- MarkerLayer (HudArmies.jsx): army markers projected every frame, fading on the far side; dashed march routes in the owner colour with arrowhead and "Day N" chip; reticles; win/lose/strike/nuke bursts; projectile arcs for strikes. Paths come from /api/army/plan and armies[].path.
- Army pane: Invade (land/sea with km, days, strength, win chance, blocked reasons), Strike from range (artillery/air/missile/nuke with lock reasons), Manpower + Upkeep tiles, Send forces with per-neighbour days and "Not at war / Truce / No access" states.
- Research mode (5th hotbar slot, key R): HudResearch.jsx tech track with states done/active/available/can't afford/locked/waiting; the nuke card has hazard styling.
- Diplomacy pane: proposals ("… proposed · waiting"), access badge, truce countdown with no actions.
- Country header: "Occupied · N%" badge with tooltip.
- Fog of war: globe dimming, hidden enemy stacks, "?" defence with FogNote, eye-slash in the hover card.
- Tooltips: port the Tooltip component and the Tip hover-intent (300ms show, instant hide, clamp 8px inside the screen, arrow offset). All copy is in hud/hudTips.js; move it to public/js/hud/tips.js unchanged.
Then add visual:hud pairs for: army-germany, army-china (blocked), army-russia, research, diplomacy, fog (KOR), tooltip-food (hover with a 400ms wait). Make them pass.
```

## P2-8: Balance pass and full QA
```
1. Write tools/sim/run.php, which simulates 5 AI-only matches for 120 days with seeded RNG. Report: day of first conquest, winner and day, share curve, average army size vs manpower limit, days with starvation, whether a nuke was used. Flag anything degenerate (e.g. no conquest by day 60, or a winner before day 30).
2. Propose GameConfig tweaks in docs/balance-v2.md. DON'T apply them; ask me.
3. Run every suite (smoke_test, visual:components, visual:hud, test:hud) and report the tables.
```
