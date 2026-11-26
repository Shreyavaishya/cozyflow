import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import StatsPanel from '@/components/StatsPanel';
import { fmtGoal } from '@/lib/format';
import { getGoalProgress, getStreak, getStreakInfo, toDateKey, useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';

const daysAgo = (n: number) => toDateKey(new Date(Date.now() - n * 86400000));
const day = (n: number, minutes = 25) => ({ date: daysAgo(n), count: 1, minutes });
const days = (...ns: number[]) => ns.map(n => day(n));

describe('streak without a freeze (unchanged behaviour)', () => {
  it('counts consecutive days and breaks on a miss', () => {
    expect(getStreak(days(0, 1, 2))).toBe(3);
    expect(getStreak(days(0, 1, 3, 4))).toBe(2);
    expect(getStreak(days(1, 2))).toBe(2);   // today not done yet: not broken
    expect(getStreak(days(2, 3))).toBe(0);
  });
});

describe('streak freeze (Pro)', () => {
  it('bridges one missed day and does not add it to the count', () => {
    const info = getStreakInfo(days(0, 1, 3, 4), true); // day 2 missed
    expect(info.streak).toBe(4);
    expect(info.frozenDays).toEqual([daysAgo(2)]);
    expect(getStreak(days(0, 1, 3, 4), false)).toBe(2);
  });

  it('allows only one freeze per 7-day window', () => {
    // misses on day 2 and day 5 (3 days apart): the second one breaks the streak
    const info = getStreakInfo(days(0, 1, 3, 4, 6, 7), true);
    expect(info.streak).toBe(4);               // 0, 1, 3, 4
    expect(info.frozenDays).toEqual([daysAgo(2)]);
  });

  it('allows a second freeze exactly 7 days after the first, but not 6', () => {
    const sevenApart = getStreakInfo(days(0, 1, 3, 4, 5, 6, 7, 8, 10), true); // misses on 2 and 9
    expect(sevenApart.frozenDays).toEqual([daysAgo(2), daysAgo(9)]);
    expect(sevenApart.streak).toBe(9);

    const sixApart = getStreakInfo(days(0, 1, 3, 4, 5, 6, 7, 9), true);       // misses on 2 and 8
    expect(sixApart.frozenDays).toEqual([daysAgo(2)]);
    expect(sixApart.streak).toBe(7);
  });

  it('does not bridge two missed days in a row', () => {
    expect(getStreak(days(0, 1, 4, 5), true)).toBe(2);
  });

  it('never counts trailing missed days that have no earlier session to connect to', () => {
    const info = getStreakInfo(days(0), true);
    expect(info.streak).toBe(1);
    expect(info.frozenDays).toEqual([]);
  });

  it('keeps the streak alive when yesterday was missed and today is still open', () => {
    expect(getStreak(days(2, 3), true)).toBe(2);
  });

  it('is identical with or without a freeze when nothing was missed', () => {
    const h = days(0, 1, 2, 3);
    expect(getStreak(h, true)).toBe(getStreak(h, false));
    expect(getStreakInfo(h, true).frozenDays).toEqual([]);
  });
});

describe('daily goal', () => {
  it('reports progress, caps the bar at 100% and detects reaching the goal', () => {
    expect(getGoalProgress([day(0, 30)], 60)).toEqual({ minutes: 30, goal: 60, ratio: 0.5, reached: false });
    expect(getGoalProgress([day(0, 90)], 60)).toMatchObject({ ratio: 1, reached: true });
    expect(getGoalProgress([day(1, 90)], 60)).toMatchObject({ minutes: 0, reached: false }); // yesterday does not count
    expect(getGoalProgress([], 0).goal).toBe(1); // never divides by zero
  });

  it('formats goals compactly', () => {
    expect([30, 45, 60, 90, 120, 180].map(fmtGoal)).toEqual(['30m', '45m', '1h', '90m', '2h', '3h']);
  });
});

describe('Statistics panel', () => {
  const seed = (history: ReturnType<typeof day>[], goal = 60) => {
    useStore.setState({
      stats: { totalSessions: history.length, totalMinutes: history.reduce((a, h) => a + h.minutes, 0), dailyHistory: history },
      settings: { ...useStore.getState().settings, dailyGoalMinutes: goal },
    });
  };
  beforeEach(() => { useProStore.setState({ isPro: false }); seed([]); });

  it('shows progress toward the goal', () => {
    seed([day(0, 30)]);
    render(<StatsPanel />);
    expect(screen.getByText('30m / 1h')).toBeTruthy();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('30');
    expect(bar.getAttribute('aria-valuemax')).toBe('60');
    expect(screen.queryByText(/Goal reached/)).toBeNull();
  });

  it('celebrates when the goal is reached', () => {
    seed([day(0, 75)]);
    render(<StatsPanel />);
    expect(screen.getByText(/Goal reached today/)).toBeTruthy();
  });

  it('lets you change the goal with presets and a custom value, clamped to a sane range', () => {
    render(<StatsPanel />);
    fireEvent.click(screen.getByTitle('Change your daily goal'));
    fireEvent.click(screen.getByText('2h'));
    expect(useStore.getState().settings.dailyGoalMinutes).toBe(120);

    const input = screen.getByLabelText('Custom daily goal in minutes');
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.blur(input);
    expect(useStore.getState().settings.dailyGoalMinutes).toBe(45);

    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.blur(input);
    expect(useStore.getState().settings.dailyGoalMinutes).toBe(600);

    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);
    expect(useStore.getState().settings.dailyGoalMinutes).toBe(5);
  });

  it('offers the freeze only to free users who have a streak worth protecting', () => {
    seed(days(0, 1, 2, 3));
    const { unmount } = render(<StatsPanel />);
    expect(screen.getByText(/Protect your 4-day streak with Pro/)).toBeTruthy();
    unmount();

    seed(days(0));
    render(<StatsPanel />);
    expect(screen.queryByText(/Protect your/)).toBeNull();
  });

  it('for Pro: the freeze keeps the streak and shows a snowflake, with no upsell', () => {
    useProStore.setState({ isPro: true });
    seed(days(0, 1, 3, 4)); // day 2 missed
    render(<StatsPanel />);
    expect(screen.getByLabelText('Streak freeze used')).toBeTruthy();
    expect(screen.getByText('4d')).toBeTruthy();
    expect(screen.queryByText(/Protect your/)).toBeNull();
  });

  it('for free users the same history shows the broken streak and no snowflake', () => {
    seed(days(0, 1, 3, 4));
    render(<StatsPanel />);
    expect(screen.getByText('2d')).toBeTruthy();
    expect(screen.queryByLabelText('Streak freeze used')).toBeNull();
  });
});

describe('saved settings', () => {
  it('existing users get a 60 minute goal after the update', async () => {
    const old = { ...useStore.getState().settings } as Record<string, unknown>;
    delete old.dailyGoalMinutes;
    localStorage.setItem('cozy-pomodoro-storage', JSON.stringify({ state: { settings: old }, version: 6 }));
    await useStore.persist.rehydrate();
    expect(useStore.getState().settings.dailyGoalMinutes).toBe(60);
  });
});