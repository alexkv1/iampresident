# Balance pass (phase-2) — findings & proposed tweaks

Generated from `tools/sim/run.php` — N AI-only matches, 120 in-game days, seeded RNG
(`php tools/sim/run.php 5 120 12345`). **Nothing here has been applied.** These are
proposals for `GameConfig.php` only; per the handoff I'm leaving the numbers as-is in
code until you approve a change. All tuning would live in `GameConfig`, never in logic.

## How to reproduce

```
php tools/sim/run.php [matches=5] [days=120] [seed=12345]
```

Each match seats 6 equal AIs (USA, China, Russia, Brazil, India, Australia) spread
across continents, starts them via `MatchSetup`, and advances 120 ticks. Reported per
match: first-conquest day, winner + day, leader-share curve (every 20 days), average
army size vs manpower limit, days with starvation, and whether a nuke fired. The sim
flags degenerate games (no conquest by day 60, a winner before day 30, chronic
starvation, or armies tiny vs manpower).

## What the sim shows (representative run, seed 2026)

| Metric | Result | Read |
|---|---|---|
| First conquest | **day 5** every match | Healthy — AIs expand into neutrals immediately. |
| Winner by day 120 | **none** (0/5) | Expansion plateaus at ~15% world share; no path to the 60% domination win inside 120 days. |
| Leader share curve | 14% → ~15% and flat from ~day 40 | Each AI grabs its immediate neutral neighbours, then stalls. |
| Starvation | **~108 / 120 days** | Large-population starts run a persistent food deficit. |
| Avg army fill | **~4%** of manpower limit | Armies stay tiny relative to what the population could field. |
| Nuke used | no | Reaching nukes needs a long tech+economy runway the AIs never get to. |

The first two rows are the clearest signals. "First conquest day 5 / no winner by 120"
is *not* a rules bug — it's the expected shape of a 6-way map where each side eats its
local neutrals and then meets resistance. The starvation and tiny-army rows are the
ones worth acting on.

## Findings & proposed tweaks (NOT applied — awaiting your call)

### 1. Large nations starve for most of the match
**Observation:** countries like USA/China/India sit at `food < 1` for ~90% of the game,
which drags population (and therefore manpower) down for the whole match.

**Likely causes (two levers):**
- *AI economy ordering* — the AI builds a power plant first and only reaches farms a few
  ticks in, so big nations start underwater on food and never climb out. This is an
  **AI-behaviour** issue, fixable without touching balance: when `food` is negative or
  `pop` is falling, the AI should build farms before anything else.
- *Food balance for big populations* — `FOOD_PER_POP` vs farm `produces.food` may simply
  be too tight at the top of the population range.

**Proposed (pick one, don't need both):**
- Preferred: adjust the AI build priority (code change in `AI::act`, not a constant) to
  prioritise farms while starving. Zero balance risk to the human game.
- Or, if you'd rather tune balance: raise farm `produces.food` by ~15–20%, **or** lower
  `GameConfig::FOOD_PER_POP` by ~15%. This also helps human megastates.

### 2. Armies stay ~4% of the manpower limit
**Observation:** average end-game army is ~59 units against an average manpower limit of
~1650 (USA alone is ~3300). The AI trains in small batches and spends stacks expanding
without reinforcing, so armies never approach the cap.

**Read:** this is an **AI-behaviour** limitation of the lightweight offensive AI added
for the sim (trains one batch when it can afford it; marches one stack at a time). It is
*not* evidence that unit costs/manpower are mis-tuned.

**Proposed:** if deeper sims are wanted, give the AI a reinforcement loop (hold a garrison
fraction, mass before attacking) rather than changing `GameConfig`. No constant change
recommended.

### 3. No domination winner within 120 days
**Observation:** share plateaus at ~15%; nobody nears 60%.

**Read:** mostly a consequence of (2) — stalled expansion once easy neutrals are gone.
With a stronger AON it would resolve. **Do not** lower `DOMINATION_SHARE` (0.60 is the
design intent); the fix is AI depth, not the win threshold. For *human-vs-AI* games the
60% target is reachable because a human reinforces and pushes.

### 4. Nukes never fire in AI-only games
**Observation:** no nuclear strikes across the sample.

**Read:** expected — the tech ladder to warheads (Artillery→Air→SRBM→MRBM→ICBM→Nuclear,
plus 5 Research Labs and tens of thousands of gold/minerals) is a deliberately long
runway the passive-economy AIs never complete in 120 days. The nuke *mechanics* are
verified separately in `smoke_test` PHASE-5 (case ff). No change proposed.

## Recommendation

Hold all `GameConfig` numbers as-is. The only change I'd actually suggest is a small
**AI build-priority** tweak (finding 1, farms-while-starving) which is behaviour, not
balance — say the word and I'll apply just that. Everything else is AI depth, which is
out of scope for the phase-2 rules and better addressed when the AI gets a dedicated pass.
