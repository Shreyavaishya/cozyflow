export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://cozyflow.vercel.app';
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
