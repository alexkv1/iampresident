# Phase-2 decisions log

Judgment calls made while implementing the phase-2 handoff autonomously. Format: what · why · where.

## Setup / handoff v2 swap
- **Refreshed `public/css/tokens/*`, `public/css/phosphor/*`, `public/fonts/*` from v2's `design/`** (not just the path strings). Why: v2's `tokens/base.css` adds the `iap-tip-in` keyframe (needed by the new Tooltip) and keeps assets in sync with the v2 design source; colours were verified identical. Where: `public/css/tokens/`, `public/css/phosphor/`, `public/fonts/`.
## P2-1
- **Updated `db/schema.sql` to v2 in addition to writing `db/migrations/002_rules_v2.sql`.** Why: fresh installs (local dev, `smoke_test`'s drop/recreate) need the v2 columns/tables without applying migrations; the migration upgrades existing/deployed DBs. Both verified (fresh load + idempotent re-run + proven to re-add dropped columns). Where: `db/schema.sql`, `db/migrations/002_rules_v2.sql`.
- **Kept legacy `armies.type`/`count` as nullable rather than dropping them.** Why: non-destructive; `armies.units` JSON is now authoritative but old rows stay readable. Where: schema + migration.
- **Artillery/missile icons** set to Phosphor guesses (`crosshair-simple`, `rocket`, `radioactive`) in `GameConfig`; will reconcile with the HUD in P2-7. Where: `GameConfig::UNITS`, `ARSENAL`.

- **Ported the new `Tooltip` component** (v2 added `components/feedback/Tooltip.jsx` and uses it in `feedback.card.html`). Why: keep `visual:components` at 10/10 and the HUD hover tooltip (§2.10) will reuse it. Where: `public/css/components.css` (`.tooltip*`), `public/js/ui-kit.js` (`UI.tooltip`), `public/dev/components.php` (feedback builder).
