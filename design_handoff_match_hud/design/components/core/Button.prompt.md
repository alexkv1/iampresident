Chunky game button with a pressable 3D lip — use for every action (Play, Ready up, Start match, Join, Send, Exit).

```jsx
<Button variant="gold" icon="play" slanted>Start match</Button>
<Button variant="primary">Ready up</Button>
<Button size="sm" variant="ghost" icon="sign-out">Exit</Button>
```

- Variants: `gold` (hero CTA — one per screen), `primary` (teal confirm), `default` (navy), `danger`, `ghost` (no lip).
- Labels render in uppercase italic Barlow Condensed; write them in sentence case, the component uppercases.
- `slanted` = parallelogram; reserve for the single most important CTA.
