/**
 * Loaders for the heavy pages. Shared by the router and by the "Open app" links on the landing page,
 * so hovering or touching a link starts downloading the app before the click (the import is cached).
 */
export const loadApp = () => import('@/pages/Index');