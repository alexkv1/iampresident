---
name: iampresident-design
description: Use this skill to generate well-branded interfaces and assets for I Am President (realtime multiplayer globe strategy game), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Quick orientation:
- `README.md`: the design guide (voice, visual foundations, iconography, component index).
- `styles.css`: link it to get every token, both webfonts and the Phosphor icon fonts.
- `components/`: React primitives (Button, Panel, ResourceChip, PlayerRow, BuildItem, …), each with a `.prompt.md` usage note.
- `ui_kits/game/`: the full Home → Lobby → Match click-through, including the three.js globe (`globe.js`) and mock game data (`data.js`).
- `guidelines/*.html`: foundation specimen cards.
- Source repo: https://github.com/alexkv1/iampresident
