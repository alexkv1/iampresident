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
