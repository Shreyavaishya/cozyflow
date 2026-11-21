// Set these in .env / Vercel so the legal pages show your real details.
export const LEGAL = {
  product: 'Cozy Flow',
  owner: (import.meta.env.VITE_OWNER_NAME as string | undefined) || '[Your full legal name]',
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || '[your-email@example.com]',
  city: (import.meta.env.VITE_OWNER_CITY as string | undefined) || '[Your city]',
  updated: 'November 21, 2026',
};
