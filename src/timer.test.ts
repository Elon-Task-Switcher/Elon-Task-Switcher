import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SESSION_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  createDefaultSession,
  formatRemainingTime,
  loadSession,
  loadSettings,
  convertMinutesToMilliseconds,
  sanitizeSettings,
  saveSession,
  saveSettings,
} from './timer';

beforeEach(() => localStorage.clear());

describe('timer settings and storage', () => {
  it('keeps defaults when storage is empty or contains invalid JSON', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadSession(DEFAULT_SETTINGS)).toEqual(createDefaultSession(DEFAULT_SETTINGS));

    localStorage.setItem(SETTINGS_STORAGE_KEY, '{');
    localStorage.setItem(SESSION_STORAGE_KEY, 'null');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadSession(DEFAULT_SETTINGS)).toEqual(createDefaultSession(DEFAULT_SETTINGS));
  });

  it('clamps durations, cadence, and volumes while retaining valid sound choices', () => {
    expect(sanitizeSettings({
      workMinutes: -1,
      breakMinutes: 200,
      intervalsBeforeBreak: 1.6,
      autoStartNextWork: false,
      reminderSoundId: 'alarm',
      breakTickSoundId: 'digital',
      reminderVolume: -1,
      breakTickVolume: 2,
    })).toEqual({
      workMinutes: 0.05,
      breakMinutes: 180,
      intervalsBeforeBreak: 2,
      autoStartNextWork: false,
      reminderSoundId: 'alarm',
      breakTickSoundId: 'digital',
      reminderVolume: 0,
      breakTickVolume: 1,
    });
    expect(sanitizeSettings({
      workMinutes: NaN,
      breakMinutes: Infinity,
      intervalsBeforeBreak: NaN,
      reminderVolume: NaN,
      breakTickVolume: Infinity,
    })).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ intervalsBeforeBreak: 0 }).intervalsBeforeBreak).toBe(1);
    expect(sanitizeSettings({ intervalsBeforeBreak: 200 }).intervalsBeforeBreak).toBe(180);
  });

  it('restores defaults for invalid persisted sound identifiers and preserves stored coercion', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      workMinutes: '7',
      reminderSoundId: 'unknown',
      breakTickSoundId: 'unknown',
      autoStartNextWork: 'false',
    }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves normalized settings under the existing v1 key', () => {
    saveSettings({ ...DEFAULT_SETTINGS, workMinutes: 999 });
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual({
      ...DEFAULT_SETTINGS,
      workMinutes: 180,
    });
  });
});

describe('timer sessions', () => {
  it('restores active time from its absolute deadline and clamps overdue time to zero', () => {
    saveSession({ status: 'running', remainingMs: 123, completedIntervals: 2, deadline: 5000 });
    expect(loadSession(DEFAULT_SETTINGS, localStorage, 2000)).toEqual({
      status: 'running', remainingMs: 3000, completedIntervals: 2, deadline: 5000,
    });
    expect(loadSession(DEFAULT_SETTINGS, localStorage, 6000).remainingMs).toBe(0);
    saveSession({ status: 'break-running', remainingMs: 123, completedIntervals: 12, deadline: 5000 });
    expect(loadSession(DEFAULT_SETTINGS, localStorage, 2000).remainingMs).toBe(3000);
  });

  it('keeps paused time and the persisted zero-time recovery shape', () => {
    saveSession({ status: 'paused', remainingMs: 123, completedIntervals: 2, deadline: 5000 });
    expect(loadSession(DEFAULT_SETTINGS, localStorage, 2000).remainingMs).toBe(123);
    const overdueSession = { status: 'running' as const, remainingMs: 0, completedIntervals: 0, deadline: null };
    saveSession(overdueSession);
    expect(loadSession(DEFAULT_SETTINGS)).toEqual(overdueSession);
  });

  it('normalizes invalid session fields and chooses the current mode duration', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      status: 'unknown', remainingMs: -2, completedIntervals: 1.6, deadline: 'later',
    }));
    expect(loadSession(DEFAULT_SETTINGS)).toEqual({
      status: 'idle', remainingMs: 0, completedIntervals: 2, deadline: null,
    });
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ status: 'break-running' }));
    expect(loadSession({ ...DEFAULT_SETTINGS, breakMinutes: 3 }).remainingMs).toBe(180000);
  });

  it('converts minutes and rounds displayed time upward without displaying negative seconds', () => {
    expect(convertMinutesToMilliseconds(0.05)).toBe(3000);
    expect(formatRemainingTime(60001)).toBe('01:01');
    expect(formatRemainingTime(1)).toBe('00:01');
    expect(formatRemainingTime(0)).toBe('00:00');
    expect(formatRemainingTime(-100)).toBe('00:00');
  });
});
