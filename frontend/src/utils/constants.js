export const CATEGORIES = [
  { value: 'FOOD', label: 'Food', icon: '🍔', color: '#FF6B6B' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚌', color: '#4ECDC4' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍', color: '#FFE66D' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎮', color: '#A78BFA' },
  { value: 'EDUCATION', label: 'Education', icon: '📚', color: '#60A5FA' },
  { value: 'HEALTH', label: 'Health', icon: '💊', color: '#34D399' },
  { value: 'UTILITIES', label: 'Utilities', icon: '⚡', color: '#FBBF24' },
  { value: 'OTHER', label: 'Other', icon: '📦', color: '#9CA3AF' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c])
);

export const formatCurrency = (amount) =>
  `₹${(amount || 0).toLocaleString('en-IN')}`;
