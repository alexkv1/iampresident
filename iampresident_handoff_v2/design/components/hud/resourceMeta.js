// Shared resource metadata (icons = Phosphor Fill names; colours = --res-* tokens).
export const resourceMeta = {
  food: { label: 'Food', icon: 'grains', color: 'var(--res-food)' },
  energy: { label: 'Energy', icon: 'lightning', color: 'var(--res-energy)' },
  minerals: { label: 'Minerals', icon: 'diamond', color: 'var(--res-minerals)' },
  gold: { label: 'Gold', icon: 'coins', color: 'var(--res-gold)' },
  oil: { label: 'Oil', icon: 'drop', color: 'var(--res-oil)' },
  research: { label: 'Research', icon: 'flask', color: 'var(--res-research)' },
};

// Mirrors UI.num() in public/js/ui.js: 1234567 -> "1.23M", 12345 -> "12.3K"
export function formatNum(n) {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}
