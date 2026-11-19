Explainer tooltip for HUD icons and controls — tells new players what a thing is and how it's used; shows after a 300ms hover.

```jsx
<Tooltip placement="bottom" icon="grains" tone="var(--res-food)" title="Food"
  body="Feeds your people. Every million citizens eat 2 food a day. If it runs out, population shrinks 1.5% a day."
  stats={[{ label: 'Now', value: '2 410' }, { label: 'Per day', value: '+86', color: 'var(--green-300)' }, { label: 'Made by', value: 'Farm' }]} />
<Tooltip placement="top" icon="hammer" title="Build" keyHint="B" body="Construct farms, mines and power in lands you control." />
```

- Fixed 260px width; body is Rubik 13/1.45 `#b9c3db`; title is display italic 800 19px.
- Presentational only: the HUD measures the anchor and positions it (centre on the anchor, clamp 8px inside the screen, pass `arrowOffset` when clamped).
- Show after 300ms hover-intent, hide immediately on leave; pop in with `iap-tip-in` (150ms).
- Copy rule: max two sentences, second person, concrete numbers from GameConfig.
