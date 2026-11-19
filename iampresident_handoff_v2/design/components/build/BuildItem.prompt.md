Build catalogue row in the right-hand Build panel.

```jsx
<BuildItem name="Farm" icon="grains" tone="var(--res-food)" cost={{ gold: 120, minerals: 40 }} days={3} />
<BuildItem name="Bank" icon="bank" tone="var(--gold-600)" cost={{ gold: 300 }} days={4} disabled />
```

- Catalogue (GameConfig::BUILDINGS): Farm, Mine, Oil Rig, Power Plant, Factory, Research Lab, Bank, Housing.
