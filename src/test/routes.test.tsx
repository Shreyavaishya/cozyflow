import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import App from '@/App';

class Observer { observe() {} unobserve() {} disconnect() {} }

beforeAll(() => {
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver ??= Observer;
  (globalThis as unknown as Record<string, unknown>).ResizeObserver ??= Observer;
});
afterEach(() => window.history.pushState({}, '', '/'));

const LOADING = '[role="status"][aria-label="Loading"]';

/** Opens a URL in the real router and waits until the lazily loaded page has replaced the loading screen. */
const open = async (path: string) => {
  window.history.pushState({}, '', path);
  const view = render(<App />);
  await waitFor(() => expect(view.container.querySelector(LOADING)).toBeNull(), { timeout: 15000, interval: 50 });
  return view;
};

// Every page is downloaded on demand, so each one must pass through the loading screen and then render.
describe('lazy routes', () => {
  it('shows a loading indicator first', () => {
    window.history.pushState({}, '', '/');
    const { container, unmount } = render(<App />);
    expect(container.querySelector(LOADING)).not.toBeNull();
    unmount();
  });

  it.each([
    ['/', 'Pick your aesthetic'],
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Service'],
    ['/refund', 'Refund and Cancellation Policy'],
    ['/contact', 'Operated by'],
    ['/sponsor', 'Sponsor Cozy Flow'],
    ['/embed', 'Made with Cozy Flow'],
    ['/app', 'Statistics'],
  ])('%s loads and renders its content', async (path, expected) => {
    const { container, unmount } = await open(path);
    expect(container.textContent).toContain(expected);
    unmount();
  }, 20000);

  it('unknown addresses show the not-found page', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {}); // that page logs the bad path on purpose
    const { container, unmount } = await open('/this-page-does-not-exist');
    expect(container.textContent).toContain('Page not found');
    unmount();
    quiet.mockRestore();
  });
});