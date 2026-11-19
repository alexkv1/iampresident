Phosphor icon glyph — use for every icon in the game UI (resources, buildings, modes, feed events); never emoji.

```jsx
<Icon name="coins" color="var(--res-gold)" size={20} />
<Icon name="caret-down" weight="bold" />
```

- `weight="fill"` (default) for chunky game glyphs; `weight="bold"` for small utility icons (input adornments, carets).
- Resource → icon map: food=grains, energy=lightning, minerals=diamond, gold=coins, oil=drop, research=flask.
