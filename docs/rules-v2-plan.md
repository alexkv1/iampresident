# Rules v2 — implementation map (GAME_RULES.md → code)

Server is authoritative; the mockup/hudGeo.js are client illustrations. All constants live in `GameConfig.php`.

| GAME_RULES § | Logic home | API | HUD |
|---|---|---|---|
| §1 Units, upkeep, manpower | `GameConfig::UNITS`; `Tick` (upkeep/desertion/grounding before production); `Economy` | `match/get` me.upkeep, me.manpower | HudArmies forces/manpower/upkeep |
| §1a Training | `Training.php` (batches of 5, slots = 1 + active Factories); `training` table | `POST /api/army/train` | HudArmies queue + slots |
| §2 Movement | `Movement.php` (centroid km, pathKm ×1.2, BFS land path, sea route, stack speed, days) | `POST /api/army/move`, `GET /api/army/plan` | MarkerLayer routes; Army pane Send/Invade |
| §3 Combat | `Combat.php` rewrite `resolveArrivals` (A/D formulas, terrain, amphibious, U(.85,1.15), losses, survivors return) | (resolved in Tick) | win/lose bursts; win-chance |
| §4 Garrisons | `GameConfig::garrison()`, `Combat`/`Occupation` (militia 50%, occupied 0, damage recover 10%/day) | match/get territories | defence numbers |
| §5 Start + victory | `MatchSetup` (s = clamp(√(gdp/500000),.6,3)), `Tick::checkVictory` (0.4 pop+0.3 area+0.3 gdp) | match/get player.share | world-control bar |
| §6 Occupation | `Occupation.php` (occupied_until=+10, unrest, revolt@100, integrate) run in `Tick` | match/get territories | "Occupied · N%" badge |
| §7 Diplomacy | `Diplomacy.php` rewrite (proposals, truce 10d unbreakable, directional access, AI answers) | `POST /api/diplomacy/{propose,respond,declare-war}` | Diplomacy pane |
| §8 Research | `Research.php` (one project, pay on start, player_tech) | `GET /api/research/list`, `POST /api/research/start` | Research mode (HudResearch) |
| §8/§9 Arsenal | `arsenal` table; Build "Missile" items; `GameConfig::STRIKES` | `POST /api/build/queue` (missile) | Army pane stock |
| §9 Strikes | `Strike.php` (artillery/air/missile/nuke, damage order, cooldown, range, nuke consequences + retaliation) | `POST /api/strike` | Army pane Strike-from-range |
| §10 Fog | `Vision.php` (own+allied lands+stacks+1 border); `match/get` strips hidden enemy armies, defence:null | match/get filtered | globe dim, "?" defence |
| §11 Events | emitted via `match_events` across the above | WS `realtime_emit` | feed |
| §12 Schema | `db/migrations/002_rules_v2.sql` + `db/schema.sql` | – | – |

New engine files: `Movement.php`, `Training.php`, `Occupation.php`, `Research.php`, `Strike.php`, `Vision.php`. Rewrites: `Combat.php`, `Diplomacy.php`, and additions to `Tick.php`, `Economy.php`, `MatchSetup.php`, `Build.php`, `GameConfig.php`.
New API dirs: `public/api/army/{move,plan,train}`, `public/api/diplomacy/{propose,respond,declare-war}`, `public/api/research/{list,start}`, `public/api/strike`.

## Open questions
- None blocking: GAME_RULES is the authority; assumptions in §13 are accepted. Judgment calls recorded in `docs/decisions.md`.
