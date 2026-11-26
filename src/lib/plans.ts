export type PlanId = 'monthly' | 'yearly' | 'lifetime';

export const PLANS: Record<PlanId, { label: string; price: number; period: string; blurb: string }> = {
  monthly:  { label: 'Monthly',  price: 49,  period: '/month', blurb: 'Cancel anytime, no auto-renew' },
  yearly:   { label: 'Yearly',   price: 399, period: '/year',  blurb: 'Save 32% · about ₹33/month' },
  lifetime: { label: 'Lifetime', price: 799, period: ' once',  blurb: 'Pay once, Pro forever' },
};

export const PRO_FEATURES = [
  'Weekly streak freeze: a missed day will not break your streak',
  'Focus heatmap and full history',
  'Extra ambient sounds (brown and white noise)',
  'All aesthetic scenes (Fireplace, Academia, Sunrise and more)',
  'Extra accent colors and unlimited countdowns',
  'No sponsor cards',
  'Support an indie developer 💛',
];