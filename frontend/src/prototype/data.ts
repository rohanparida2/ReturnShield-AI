export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  score: number;
  scoreLabel: string;
  reviews: number;
  productClass: string;
  badge: string;
  summary: string;
};

export const prototypeProducts: Product[] = [
  {
    id: 'aerobuds',
    name: 'AeroBuds Pro',
    category: 'Audio · Wireless earbuds',
    price: '$129',
    score: 91,
    scoreLabel: 'Great match',
    reviews: 284,
    productClass: 'product-audio',
    badge: 'Top pick',
    summary: 'Comfortable for long listening sessions, with a secure fit that stays put on commutes and workouts.'
  },
  {
    id: 'cloudknit',
    name: 'CloudKnit Runner',
    category: 'Footwear · Everyday',
    price: '$98',
    score: 58,
    scoreLabel: 'Some trade-offs',
    reviews: 146,
    productClass: 'product-shoe',
    badge: 'Worth a closer look',
    summary: 'Light and breathable, but reviewers with wider feet often recommend sizing up.'
  },
  {
    id: 'driftcase',
    name: 'Drift Laptop Sleeve',
    category: 'Accessories · 14 inch',
    price: '$42',
    score: 84,
    scoreLabel: 'Good match',
    reviews: 98,
    productClass: 'product-case',
    badge: 'Popular',
    summary: 'A slim, padded everyday sleeve with a smooth zipper and room for small essentials.'
  }
];

export const fitThemes = [
  { label: 'Comfort', value: 92, icon: 'sparkles' },
  { label: 'True to size', value: 86, icon: 'ruler' },
  { label: 'Build quality', value: 89, icon: 'shield' },
  { label: 'Value', value: 78, icon: 'heart' }
];
