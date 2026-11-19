# I Am President: game rules v2 (realistic strategy)

This is the authoritative rules spec for movement, combat, economy of war, research, strikes, occupation, diplomacy and fog of war. It replaces the simplified rules in `utils/engine/Combat.php` and `Diplomacy.php`.

All constants live in `GameConfig.php`. Every number in this document is a starting balance value: tune it there, never in logic. The mockup (`ui_kits/game/match-hud.html`) implements these rules client-side for illustration. The **server is the authority**, so implement everything in PHP and let the client only display it.

Time model: 1 tick = 1 in-game **day** = `tick_interval_sec` real seconds, **default 20**, so 3 days pass every real minute. A 3-day march takes 1 minute, and a 10-day occupation takes 3 min 20 s. Set the default in `db/schema.sql` (`matches.tick_interval_sec DEFAULT 20`), `match/create` and `GameConfig::TICK_SECONDS`.

---

## 1. Units

| Unit | Attack | Defence | Speed (km/day) | Upkeep / day | Cost | Build days | Unlock |
|---|---|---|---|---|---|---|---|
| Infantry | 1 | 2 | 400 | 1 gold, 1 food | 40 gold, 10 minerals | 2 | – |
| Artillery | 2 | 1 | 300 | 2 gold, 1 food | 150 gold, 80 minerals | 3 | tech `artillery` |
| Armor | 3 | 2 | 600 | 3 gold, 1 food, 1 oil | 120 gold, 60 minerals, 20 oil | 4 | – |
| Navy (ship) | 0 on land | 0 on land | 900 at sea | 5 gold, 1 food, 2 oil | 260 gold, 120 minerals, 50 oil | 7 | – |
| Air Force (plane) | strikes only | – | strikes only | 6 gold, 3 oil | 200 gold, 80 minerals, 40 oil | 6 | tech `air` |

- **One unit is an abstract formation** (≈1 000 personnel), and each unit uses **1 manpower**.
- **Manpower limit:** `floor(population × 0.01 / 1000)`, i.e. 1% of the population. Sweden (10.6M) has 106. You can't train past the limit. If the population falls below what your army needs, training is blocked, but existing units remain.
- **Upkeep** is charged every tick before production.
  - If **gold** or **food** runs out, every stack loses 5% of its units per day (desertion; at least 1 if the stack has more than 0).
  - If **oil** runs out, armor, navy and air are grounded: they can't move or strike, but they still defend.
- **A stack** is all of one player's units in one country (`armies` row with a `units` JSON). Stacks of the same owner merge on arrival.

## 1a. Training
- **Batches:** units are trained in **batches of 5**. The whole batch is ready after the unit's `Build days`. Cost and manpower are paid when training starts.
- **Slots:** each country you own has **1 training slot** (barracks), plus **1 per active Factory** in that country. One batch per slot at a time. Occupied countries have **0 slots** until integrated.
- **Durations at 20 s/day:**

  | Unit | Days | Real time |
  |---|---|---|
  | Infantry | 2 | 40 s |
  | Artillery | 3 | 1 min |
  | Armor | 4 | 1 min 20 s |
  | Air Force | 6 | 2 min |
  | Navy | 7 | 2 min 20 s |
  | Short-range missile | 3 | 1 min |
  | Medium-range missile | 5 | 1 min 40 s |
  | ICBM | 8 | 2 min 40 s |
  | Nuclear warhead | 10 | 3 min 20 s (one at a time) |

- **Why:** a batch of infantry beats the fastest march (≥ 1 day), so you can react to an attack you see coming. A fleet or air wing is a commitment of 2+ minutes, so you have to plan ahead. Factories become the way to scale military output.
- **Storage:** a `training` table (`match_id, player, country_code, unit, count, ready_tick`). Units are added to the country's stack on `ready_tick` (event `training_complete`).

## 2. Movement
- **Distance:** the great-circle distance between country centroids (`countries.lon/lat`; overrides for RUS/USA/CAN/NOR/FRA as in `hudGeo.js`). A land path is the sum of its legs × **1.2** (road factor).
- **Stack speed** = the speed of its **slowest unit**. Days = `ceil(km / speed)`, minimum 1.
- **Land routes:** the shortest path where **every intermediate country is yours, or belongs to a player who has granted you military access** (§7). Neutral and enemy countries block the route. The target itself can be anything you're allowed to attack.
- **Sea routes:**
  - Both the origin and the target must be **coastal**. Store `countries.coastal` (true if any border segment isn't shared with another country), computed in `worker/gen_countries.js`.
  - Distance = great-circle × **1.3**, at 900 km/day.
  - Each Navy ship carries **10 land units**. If capacity is less than the number of land units, the move is refused, and the UI shows "Needs N more ships".
  - Ships travel with the stack. Navy doesn't fight on land.
- Moves are stored as `armies.path` (JSON list of codes), `kind` (`land` / `sea`), `depart_tick` and `arrive_at_tick`. During the march the stack is "in transit" and can't be attacked. The client animates it along the path.
- **No march orders between players at truce** (§7). You need to be **at war** with a player before you can march into their land. Unowned (neutral) countries can be attacked any time.

## 3. Combat (on arrival)
```
A = Σ attack(u) × count(u)                    (navy and air excluded)
    × 0.75 if the move kind is 'sea'          (amphibious landing)
D = (garrison + Σ defence(u) × count(u) of all defending stacks)
    × 1.5                                     (defender bonus)
    × terrain                                 (plains 1.0 · forest/jungle 1.2 · mountains 1.5)
    × (1 + 0.1 × fortification_level)         (future building)
A' = A × U(0.85, 1.15) ;  D' = D × U(0.85, 1.15)
```
- **Attacker wins** if `A' > D'`.
  - All defending stacks are destroyed and the territory changes owner, entering occupation (§6).
  - Attacker loses `min(0.6, 0.4 × D'/A')` of each unit type (floor; keep at least 1 unit).
- **Defender holds** otherwise.
  - Attacker loses `0.5 + 0.4 × (1 − A'/D')` of each type; survivors return to the origin by the same path.
  - Each defending stack loses `0.3 × A'/D'`. The garrison is not reduced by battles.
- **Win chance shown in the UI:** `P(A·u1 > D·u2)` with u1, u2 ~ U(0.85, 1.15). Compute it in closed form or on a 60×60 grid. Show it as "Win chance 82%".
- **Terrain:** add `countries.terrain` (`plains` default, `forest`, `mountains`) to the seed. Start with mountains = CHE, AUT, NPL, BTN, AFG, BOL, PER, NOR, GEO, ARM, KGZ, TJK and forest = BRA, COD, COG, GAB, CMR, IDN, PNG, FIN, SWE, CAN. Data team to refine.

## 4. Garrisons and defence
- **Neutral garrison:** `clamp(round(2 + 2·√pop_millions + land_slots/4), 3, 60)`. Examples: Luxembourg 5, Finland 9, Sweden 11, Germany 24, Russia 31, China 60.
- **Owned-country militia:** 50% of that formula. **Occupied countries** have militia 0.
- **Strikes** lower the garrison or militia temporarily (`territories.damage`), which recovers 10% of the base per day.

## 5. Starting position (scaled, capped)
- `s = clamp(√(gdp_md / 500 000), 0.6, 3.0)`. Gold, minerals, energy and oil start at `GameConfig::START × s`. Food stays population-based (existing rule).
- Starting army in the capital: infantry `round(5 + 1.5·√pop_M)` and armor `round(2·s)`. This counts against manpower.
- **Victory:** world score weights per country: `0.4·pop_share + 0.3·area_share + 0.3·gdp_share` (shares of world totals). Add `countries.area_km2`, computed from geometry in `gen_countries.js`. A player wins at **60% of the total weight**, or as the last nation standing. The HUD world-control bar shows weighted %, with the land count as secondary info.

## 6. Occupation
- **Duration:** a conquered country is `occupied` for **10 days** (`territories.occupied_until`). During occupation:
  - its buildings produce at 50%,
  - its militia is 0,
  - it doesn't count toward manpower.
- **Unrest** (`territories.unrest`, 0–100), updated each day:
  - +8 if the occupier has no stack there,
  - −10 if their stack's units are at least half of the base garrison,
  - otherwise +2.
- **Revolt:** at 100 the country revolts. It returns to its previous owner if they're still alive, otherwise becomes neutral, with rebels equal to the full neutral garrison. Emit a `revolt` event.
- After 10 days without a revolt the country is **integrated** (normal rules).

## 7. Diplomacy
- **States:** `neutral`, `war`, `truce` (with `truce_until`), `allied`. **Military access** is separate and directional: `access_ab`, `access_ba`.
- **Consent:** alliance, truce and access are **proposals** that the other side must accept. Store them in a new `diplomacy_proposals` table (`from`, `to`, `type`, `expires_tick` = now + 3). AI accepts or declines on its tick. Declaring war is unilateral.
- **Truces** last **10 days** and can't be broken: attack and declare-war are disabled until `truce_until`. Afterwards the state returns to neutral.
- **Allies** share fog-of-war vision. They don't automatically get passage: marching through allied land requires access.
- **Attacking a player's land** requires being at war with them, so the UI shows "Declare war first". Neutral countries need no declaration.

## 8. Research and weapons
One project at a time. The research points and gold are paid when the project starts. Progress completes after `days`. Uses the `player_tech` table.

| Tech | Requires | Research | Gold | Other | Days | Unlocks |
|---|---|---|---|---|---|---|
| Artillery | – | 300 | 1 500 | – | 4 | Artillery unit and barrage |
| Air Force | Artillery | 600 | 3 000 | – | 6 | Air Force unit and air strike |
| Short-range missiles | Artillery | 800 | 5 000 | – | 8 | SRBM (1 000 km) |
| Medium-range missiles | SRBM | 1 500 | 10 000 | – | 12 | MRBM (5 500 km) |
| ICBM | MRBM | 3 000 | 25 000 | – | 18 | ICBM (global) |
| Nuclear weapons | ICBM, 5 Research Labs | 6 000 | 60 000 | 8 000 minerals | 25 | Warheads |

## 9. Strikes (never capture land)

| Strike | Range | Effect | Cost per use | Cooldown |
|---|---|---|---|---|
| Artillery barrage | a stack with artillery in a country that **borders** the target | −2 defence per gun | 1 mineral per gun | 1 day per stack |
| Air strike | ≤ 1 500 km from a stack with planes | −3 defence per plane; lose 5% of planes if the target's base garrison > 20 | 2 oil per plane | 1 day per stack |
| SRBM | ≤ 1 000 km from the capital | −12 defence | 800 gold per missile (built, then stocked) | – |
| MRBM | ≤ 5 500 km | −18 defence | 1 500 gold | – |
| ICBM (conventional) | global | −25 defence | 4 000 gold | – |
| Nuclear | global (ICBM) | see below | warhead: 15 000 gold + 2 000 minerals, 10 days to build, max 1 in production | – |

- **Damage order:** a strike first destroys defending units (cheapest first, by defence value), and any remainder lowers the garrison or militia (`territories.damage`).
- **Missile stock:** missiles are built in the capital: Build mode → "Missile" item, unlocked per tier, with stock shown in the Army pane.
- **Nuclear strike:**
  - destroys every unit and building in the target,
  - kills 40% of its population,
  - sets the target's farmland output to 0 for **20 days**,
  - lets **every other nation declare war on the attacker immediately**, ignoring truces and with no proposal; AI does so if it isn't allied,
  - triggers **immediate retaliation** by any target-side player (owner or ally) who holds a warhead: AI fires on the attacker's capital in the same tick, and a human gets a 1-tick "Retaliate?" prompt.
  - Emit a `nuclear_strike` event. The UI shows a world-wide alert.

## 10. Fog of war
- **Vision** = your lands, plus your allies' lands (shared vision), plus every country where you have a stack or a stack in transit (origin and destination), plus every country bordering any of those.
- Outside vision, enemy stacks are hidden. Enemy defence shows as `?`, while neutral garrisons are always known (it's a rule). The globe is dimmed: owner colour lerped 60% toward `#161e30`, neutral 50%.
- **The server enforces it:** `match/get` must strip enemy armies outside the requester's vision. Never send hidden data to the client.

## 11. New events
`march_started`, `battle_won`, `battle_lost` (in addition to `conquest` and `battle_repelled`), `strike`, `nuclear_strike`, `revolt`, `integrated`, `research_started`, `research_complete`, `proposal`, `proposal_accepted`, `proposal_declined`, `truce_ended`, `desertion`, `grounded_no_oil`.

## 12. Schema changes (migration)
- `countries`: `terrain ENUM('plains','forest','mountains') DEFAULT 'plains'`, `area_km2 INT`, `coastal TINYINT`. Also `gdp_md`, which exists; make sure it's seeded.
- `armies`: `units JSON` (replaces type/count), `path JSON NULL`, `kind ENUM('land','sea') NULL`, `depart_tick INT NULL`, `origin CHAR(3) NULL`, `last_strike_tick INT NULL`.
- `territories`: `occupied_until INT NULL`, `unrest TINYINT DEFAULT 0`, `damage SMALLINT DEFAULT 0`, `prev_owner INT NULL`, `ruined_until INT NULL`.
- `diplomacy`: `truce_until INT NULL`, `access_ab TINYINT DEFAULT 0`, `access_ba TINYINT DEFAULT 0`.
- New `diplomacy_proposals(id, match_id, from_player, to_player, type ENUM('alliance','truce','access'), expires_tick, status)`.
- New `arsenal(match_id, player, item ENUM('srbm','mrbm','icbm','warhead'), stock INT, in_production INT, ready_tick INT)`.
- `player_tech`: use `tech_key`, `level` (0/1), `progress`, `started_tick`.

## 13. Explicit assumptions (confirm with design)
- Strategic movement speeds (400–900 km/day) assume road, rail and sea transport, not marching on foot. With 20 s days a typical neighbour attack lands in 40–60 s and a cross-continent march in 2–3 minutes.
- Air units don't join land battles. They only strike.
- You must be at war before attacking a player. There's no surprise attack, because reputation isn't modelled.
