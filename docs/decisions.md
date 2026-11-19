# Phase-2 decisions log

Judgment calls made while implementing the phase-2 handoff autonomously. Format: what · why · where.

## Setup / handoff v2 swap
- **Refreshed `public/css/tokens/*`, `public/css/phosphor/*`, `public/fonts/*` from v2's `design/`** (not just the path strings). Why: v2's `tokens/base.css` adds the `iap-tip-in` keyframe (needed by the new Tooltip) and keeps assets in sync with the v2 design source; colours were verified identical. Where: `public/css/tokens/`, `public/css/phosphor/`, `public/fonts/`.
## P2-2
- **Centroids/terrain/coastal read straight from the `countries` table** (no PHP override map) since `gen_countries.js` already bakes in hudGeo's `CENTROID_OVERRIDE`/`centroidOf`/terrain/coastal — server reproduces hudGeo exactly. Where: `Movement.php`.
- **Refusal nation names = `match_players.display_name`** (leader persona), matching the mockup's `o.name`. Where: `Movement::attackBlock`.
- **Added a `reinforced` event** on own/ally arrival (not in §11's list; harmless). Where: `Combat::resolveArrivals`.
- **Loss "keep ≥1" is stack-level** (faithful port of the mockup's `scaleUnits(keepOne)`; the authoritative mockup is stack-level, the prose says per-type). Where: `Combat::scaleUnits`.
- **Retreat** = the outbound `path` reversed, re-costed; if origin==current the stack just stops. Where: `Combat::retreat`.
- **`plan.php` strike section is shape/lock/range/stock-faithful only**; strike execution lands in P2-5. Where: `public/api/army/plan.php`.

## P2-8 (sim + AI)
- **Added lightweight *offensive* AI** (`AI::maybeTrain`, `AI::maybeAttack`) beyond the phase-1 economy/diplomacy AI. Why: P2-8 asks for AI-only matches with "first conquest / winner" metrics, which are meaningless if the AI never trains or fights. The AI trains an infantry batch when it can afford it + has manpower, and marches one idle stack per tick at the weakest neighbour it can beat by a 1.3× margin (expanding into neutrals freely; declaring war first on a weaker player). Deliberately modest — the balance report notes it as the limiter on deep expansion. Where: `utils/engine/AI.php`.
- **Sim seeds `mt_srand(seed + matchIndex)`** before each match; `Combat` uses `mt_rand` by default so this makes combat deterministic per seed, while keeping each of the N matches distinct. Where: `tools/sim/run.php`.
- **Balance numbers left unapplied.** The sim surfaced (1) large-nation starvation, (2) tiny armies vs manpower, (3) no 120-day winner, (4) no AI nukes. Per the handoff I did not tune `GameConfig`; `docs/balance-v2.md` records findings and proposals and asks before changing anything. The only suggested change is an AI build-priority tweak (behaviour, not balance).

## P2-6
- **Vision includes allied stacks, not just my own** (GAME_RULES §10 "allies share vision" / §7): the seed is lands + stacks of my whole *side* (me + current allies), then one border beyond their union. The literal §10 wording says "where **you** have a stack", but §7's shared vision makes allied stacks part of my sight; I chose the inclusive reading. Where: `Vision::visible`, `Vision::side`.
- **An in-transit enemy stack is visible if its origin OR destination is in vision** (its `country_code` stays the departure country until arrival; `moving_to` is the destination). Where: `Vision::canSeeArmy`.
- **Fog filtering lives in `Vision` (not inline in the endpoint)** so `match/get` and the smoke test share the exact predicate: `Vision::armies` (own/ally always, others only within vision) and `Vision::defenceMap` (neutral garrisons always known; enemy-owned countries outside vision → `null`). Where: `utils/engine/Vision.php`.
- **`match/get` now returns `armies` (fog-filtered), `defence` (code→int|null), and `vision` (visible codes).** Armies were not previously surfaced at all; P2-7's globe/markers need them, and §10 requires them stripped. Visible enemy stacks show full composition (once seen, you see them); only the country-level `defence` is nulled when fogged. Where: `public/api/match/get.php`.
- **Defence value = garrison + friendly stationed defenders** (owner's + owner's-allies' stacks), raw (no ×1.5/terrain multipliers) — a display figure, not the combat `D`. Where: `Vision::defenceMap`.

## P2-5
- **Research completes purely by elapsed time** (`started_tick + days`), paid in full at start. The `player_tech.progress` column is updated each tick for display only; completion keys off time, matching "completes after `days`". Where: `Research::start`, `Research::advance`.
- **Research/arsenal completion is Tick step 1c** (alongside training, before combat) so a tech/warhead finishing this tick is usable the same tick. Where: `Tick::process`.
- **Arsenal builds one unit at a time per item** (the single `in_production`/`ready_tick` row model); warheads additionally cap at `max_in_production=1` from config. A second build of an item in production is refused. Where: `Arsenal::build`.
- **Ruined farmland = farm buildings dropped from the economy query** while `ruined_until > tick`, rather than zeroing the `farmland` scale (which floors at 0.1 and would still yield 10%). Exactly zeroes food from a ruined country, including any rebuilt farm. Where: `Tick` economy building query.
- **Strike damage order** destroys only defending units with **defence > 0**, cheapest-by-defence first (navy/air def-0 units are skipped so they can't be wiped "for free"); each destroyed unit absorbs its own defence value, and the integer remainder raises `territories.damage`. Where: `Strike::applyDefenceDamage`.
- **Air plane loss uses the BASE garrison** (pre-strike-damage) and is `max(1, round(planes × 0.05))` so a strike on a garrison > 20 always costs at least one plane. Where: `Strike::execute` (air branch).
- **Strike cooldown** is per stack via `armies.last_strike_tick` (refuse if `last_strike_tick >= current_tick`); it's stamped only on a successful strike, so a range/cost refusal leaves the stack free to fire. Where: `Strike::execute`.
- **War/truce rules reuse `Movement::attackBlock`** — neutral targets need no declaration; allied/truce targets are refused with the same wording as movement. Where: `Strike::execute`.
- **Garrison damage recovers `max(1, round(base × 0.10))`/day** (Tick step 2d) — the `max(1,…)` guarantees a struck country always heals even when the 10% rounds to 0. Where: `Tick::recoverDamage`.
- **Nuclear cascade is bounded to one level**: the retaliatory strike runs with `allowRetaliation=false`, so it devastates the attacker's capital and may trigger AI war declarations but cannot spawn a third round. AI target-side warhead holders fire automatically; humans get a 1-tick `retaliate_prompt` event. Where: `Strike::nuclear`.
- **Nuke "every other nation may declare war" is applied to non-allied AI only** (they auto-declare, ignoring truces); human opponents are left to choose. Where: `Strike::nuclear`.
- **The strike endpoint persists its events to `match_events`** (and emits them) because strikes happen between ticks, unlike tick-generated events; this keeps the nuke alert / retaliate prompt in the client's event feed. Where: `public/api/strike.php`.
- **Light AI research**: when idle an AI starts the cheapest tech it qualifies for and can comfortably afford (gold ≥ 1.5× cost), so the tree is exercised in sims without pushing the AI toward offensive tech. Where: `AI::maybeResearch`.
- **`match/get` gained additive `me.tech` and `me.arsenal`.** Where: `public/api/match/get.php`.

## P2-4
- **Occupation runs as Tick step 2b** (after `Combat::resolveArrivals`, before economy). Why: unrest depends on which stacks are present, which combat has just settled this tick; integration/revolt should resolve before production/AI act on the new ownership. Where: `Tick::process`, `Occupation::process`.
- **Occupation uses the pre-increment `current_tick`** consistently with combat's `arrive_at_tick <= tick`. `occupied_until` (= conquest tick + 10) integrates when `tick >= occupied_until`, giving a 10-day occupation. Where: `Occupation`.
- **"Rebels = full neutral garrison" is satisfied structurally, not by spawning a rebel stack.** On revolt the land reverts to the previous owner if alive (their land → militia garrison) or to neutral (`Combat::garrisonOf` already yields the *full* neutral garrison). There is no rebel-faction player entity, so the full-garrison rule is honoured in the neutral branch; the prev-owner branch simply restores their land. Where: `Occupation::revolt`.
- **Revolt drives out only the occupier's *stationed* stacks** (`moving_to IS NULL`) in that country; in-transit stacks are untouched. It then calls `Combat::checkDefeat` (made `public`) in case it was the occupier's last land. Where: `Occupation::revolt`, `Combat::checkDefeat`.
- **Diplomacy maintenance is Tick step 2c**: expire proposals whose window closed (`expires_tick <= tick`, silent — no event in §11) and end truces (`state → neutral`, `truce_ended` event). Where: `Diplomacy::maintain`.
- **Access-proposal direction:** `propose(type:access)` means the *proposer* requests passage; on accept the *accepter* (land owner) grants directional access to the proposer (`hasAccess(owner=accepter, mover=proposer)` becomes true, reverse stays false). Where: `Diplomacy::applyAccepted`, `grantAccess`.
- **`declare-war` clears any pending proposals between the pair** (status → declined) and is refused while a truce holds; it's otherwise unilateral. Where: `Diplomacy::declareWar`.
- **AI proposal answers run first in `AI::act`** (before building, so an early return on low gold can't skip them): accept alliance iff not at war with the proposer AND a third active player is at war with both (`sharesEnemy`); accept truce iff the AI's world share < proposer's; grant access only to current allies. Where: `AI::answerProposals`.
- **`match/get` gained additive `diplomacy` (my relations: state, truce_until, access in/out) and `proposals` (pending, in or out) blocks.** Why: give the HUD (P2-7) a data path now; P2-6 fog will layer on top without removing these. Where: `public/api/match/get.php`.
- **Proposal endpoints take `match_id` explicitly** (`respond` as `{match_id,id,accept}`) even though the spec wrote `{id,accept}`; the client always knows the match and it lets `require_player` authorize without an extra lookup. `accept` parsed with `FILTER_VALIDATE_BOOLEAN` so `false`/`0`/`"no"` all decline. Where: `public/api/diplomacy/*`.

## P2-3
- **`count` in `/api/army/train` = number of batches, not raw units** (each batch = `TRAIN_BATCH` 5 units). Default 1. Why: §1a trains in fixed batches; exposing batches keeps slot/manpower checks honest per batch. Partial success allowed — if a later batch fails after ≥1 started, returns ok with what started; first-batch failure is a `json_err`. Where: `public/api/army/train.php`, `Training::start`.
- **Displayed resource deltas stay GROSS of upkeep.** The dry-run `Economy::step` path is untouched; `match/get` instead returns `me.upkeep{gold,food,oil}` for the client to subtract. Why: keeps the pure economy preview stable; upkeep is a separate tick stage. Where: `Economy::upkeep`, `match/get.php`.
- **`grounded_no_oil` emits only when oil hits 0 AND the player owes oil upkeep** (fields armor/navy/air). Why: avoid spurious events for infantry-only nations. Where: `Tick::chargeUpkeep`.
- **Training-start emits `training_started`** (chose event over silence, mirrors `build` events). Where: `Training::start`.
- **`Tick::worldShares` is `public`** so `match/get` reuses it for per-player `share` without a second query path; world totals come from `countries.pop_est/area_km2/gdp_md`. Where: `Tick`, `match/get.php`.
- **Grounding enforcement on move/strike is deferred to P2-2/P2-5 endpoints** — P2-3 only provides `Economy::isGrounded` as the hook; combat logic untouched. Where: `Economy::isGrounded`.

## P2-1
- **Updated `db/schema.sql` to v2 in addition to writing `db/migrations/002_rules_v2.sql`.** Why: fresh installs (local dev, `smoke_test`'s drop/recreate) need the v2 columns/tables without applying migrations; the migration upgrades existing/deployed DBs. Both verified (fresh load + idempotent re-run + proven to re-add dropped columns). Where: `db/schema.sql`, `db/migrations/002_rules_v2.sql`.
- **Kept legacy `armies.type`/`count` as nullable rather than dropping them.** Why: non-destructive; `armies.units` JSON is now authoritative but old rows stay readable. Where: schema + migration.
- **Artillery/missile icons** set to Phosphor guesses (`crosshair-simple`, `rocket`, `radioactive`) in `GameConfig`; will reconcile with the HUD in P2-7. Where: `GameConfig::UNITS`, `ARSENAL`.

- **Ported the new `Tooltip` component** (v2 added `components/feedback/Tooltip.jsx` and uses it in `feedback.card.html`). Why: keep `visual:components` at 10/10 and the HUD hover tooltip (§2.10) will reuse it. Where: `public/css/components.css` (`.tooltip*`), `public/js/ui-kit.js` (`UI.tooltip`), `public/dev/components.php` (feedback builder).
