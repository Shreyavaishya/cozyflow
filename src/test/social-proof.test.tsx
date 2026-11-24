import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicStats } from '@/lib/sponsors';

const fetchPublicStats = vi.fn<() => Promise<PublicStats | null>>();
vi.mock('@/lib/sponsors', () => ({ fetchPublicStats: () => fetchPublicStats() }));

import SocialProof from '@/components/SocialProof';

const stats = (over: Partial<PublicStats> = {}): PublicStats => ({
  users: 27, weekly_active: 9, sessions: 312, minutes: 7800, impressions: 0, clicks: 0, ...over,
});

beforeEach(() => fetchPublicStats.mockReset());

describe('SocialProof', () => {
  it('shows people, sessions and focus time from the database', async () => {
    fetchPublicStats.mockResolvedValue(stats());
    render(<SocialProof />);
    await waitFor(() => expect(screen.getByText(/27 people have joined/)).toBeTruthy());
    expect(screen.getByText(/312 focus sessions/)).toBeTruthy();
    expect(screen.getByText(/130\.0h focused/)).toBeTruthy();
  });

  it('uses singular wording for the first user and hides empty chips', async () => {
    fetchPublicStats.mockResolvedValue(stats({ users: 1, sessions: 0, minutes: 0 }));
    const { container } = render(<SocialProof />);
    await waitFor(() => expect(screen.getByText(/1 person has joined/)).toBeTruthy());
    expect(container.textContent).not.toContain('focus session');
    expect(container.textContent).not.toContain('focused');
  });

  it('shows minutes below one hour', async () => {
    fetchPublicStats.mockResolvedValue(stats({ minutes: 45, sessions: 2 }));
    render(<SocialProof />);
    await waitFor(() => expect(screen.getByText(/45m focused/)).toBeTruthy());
  });

  it('renders nothing when the numbers cannot be loaded or there are no users', async () => {
    fetchPublicStats.mockResolvedValue(null);
    const a = render(<SocialProof />);
    await waitFor(() => expect(fetchPublicStats).toHaveBeenCalled());
    expect(a.container.firstChild).toBeNull();
    a.unmount();

    fetchPublicStats.mockResolvedValue(stats({ users: 0 }));
    const b = render(<SocialProof />);
    await waitFor(() => expect(fetchPublicStats).toHaveBeenCalledTimes(2));
    expect(b.container.firstChild).toBeNull();
  });

  it('stops polling when it unmounts', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    fetchPublicStats.mockResolvedValue(stats());
    const { unmount } = render(<SocialProof />);
    expect(fetchPublicStats).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(fetchPublicStats).toHaveBeenCalledTimes(2);
    unmount();
    vi.advanceTimersByTime(180_000);
    expect(fetchPublicStats).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});