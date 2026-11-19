## Design system
- The visual source of truth is `iampresident_handoff_v2/design/` (tokens, components, mockups).
- Read `iampresident_handoff_v2/design/README.md` (design guide) and `iampresident_handoff_v2/README.md` (HUD spec) before any UI work.
- Copy pixel values exactly from `design/components/**/*.jsx` and `design/ui_kits/game/hud/*.jsx`. Never round to a 4/8px grid, never invent new colours; use the CSS variables from `design/tokens/`.
- Icons are Phosphor (Fill for game glyphs, Bold for utility). No emoji in UI.
- Numbers: full number with a no-break space every three digits (2 410) below 100 000, then K / M / B (see HUD spec §3).
- Stack stays PHP + jQuery + three.js. No React, no bundler.
