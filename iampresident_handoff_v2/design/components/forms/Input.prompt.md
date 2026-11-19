Sunken text field (or select) — player name, room code, chat composer.

```jsx
<Input placeholder="President…" maxLength={32} icon="user" />
<Input placeholder="Enter room code" uppercase maxLength={6} />
<Input as="select" options={['Online', 'Private', 'Single player']} />
```

- Wrap in `<Field label="Your name">` for a labelled form row.
