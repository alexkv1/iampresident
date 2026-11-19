# Phase-2 decisions log

Judgment calls made while implementing the phase-2 handoff autonomously. Format: what · why · where.

## Setup / handoff v2 swap
- **Refreshed `public/css/tokens/*`, `public/css/phosphor/*`, `public/fonts/*` from v2's `design/`** (not just the path strings). Why: v2's `tokens/base.css` adds the `iap-tip-in` keyframe (needed by the new Tooltip) and keeps assets in sync with the v2 design source; colours were verified identical. Where: `public/css/tokens/`, `public/css/phosphor/`, `public/fonts/`.
- **Ported the new `Tooltip` component** (v2 added `components/feedback/Tooltip.jsx` and uses it in `feedback.card.html`). Why: keep `visual:components` at 10/10 and the HUD hover tooltip (§2.10) will reuse it. Where: `public/css/components.css` (`.tooltip*`), `public/js/ui-kit.js` (`UI.tooltip`), `public/dev/components.php` (feedback builder).
