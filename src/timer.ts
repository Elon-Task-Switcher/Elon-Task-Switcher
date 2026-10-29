import {
  DEFAULT_SOUND_SETTINGS,
  clampVolume,
  isBreakTickSoundId,
  isReminderSoundId,
  type BreakTickSoundId,
  type ReminderSoundId,
} from './soundPresets';

export type TimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'ended'
  | 'break-due'
  | 'break-running'
  | 'break-complete';

export type TimerSettings = {
  workMinutes: number;
  breakMinutes: number;
  intervalsBeforeBreak: number;
  autoStartNextWork: boolean;
  reminderSoundId: ReminderSoundId;
  breakTickSoundId: BreakTickSoundId;
  reminderVolume: number;
  breakTickVolume: number;
};

export type TimerSession = {
  status: TimerStatus;
  remainingMs: number;
  completedIntervals: number;
  deadline: number | null;
};

export const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 5,
  breakMinutes: 5,
  intervalsBeforeBreak: 12,
  autoStartNextWork: true,
  ...DEFAULT_SOUND_SETTINGS,
};

export const SETTINGS_STORAGE_KEY = 'elon-task-switcher.settings.v1';
export const SESSION_STORAGE_KEY = 'elon-task-switcher.session.v1';

export function convertMinutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

export function clampDurationMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(180, Math.max(0.05, value));
}

export function clampIntervalsBeforeBreak(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const roundedIntervalCount = Math.round(value);
  return Math.min(180, Math.max(1, roundedIntervalCount));
}

export function sanitizeSettings(settings: Partial<TimerSettings>): TimerSettings {
  return {
    workMinutes: clampDurationMinutes(
      settings.workMinutes ?? DEFAULT_SETTINGS.workMinutes,
      DEFAULT_SETTINGS.workMinutes,
    ),
    breakMinutes: clampDurationMinutes(
      settings.breakMinutes ?? DEFAULT_SETTINGS.breakMinutes,
      DEFAULT_SETTINGS.breakMinutes,
    ),
    intervalsBeforeBreak: clampIntervalsBeforeBreak(
      settings.intervalsBeforeBreak ?? DEFAULT_SETTINGS.intervalsBeforeBreak,
      DEFAULT_SETTINGS.intervalsBeforeBreak,
    ),
    autoStartNextWork: Boolean(settings.autoStartNextWork ?? DEFAULT_SETTINGS.autoStartNextWork),
    reminderSoundId: isReminderSoundId(settings.reminderSoundId)
      ? settings.reminderSoundId
      : DEFAULT_SETTINGS.reminderSoundId,
    breakTickSoundId: isBreakTickSoundId(settings.breakTickSoundId)
      ? settings.breakTickSoundId
      : DEFAULT_SETTINGS.breakTickSoundId,
    reminderVolume: clampVolume(settings.reminderVolume, DEFAULT_SETTINGS.reminderVolume),
    breakTickVolume: clampVolume(settings.breakTickVolume, DEFAULT_SETTINGS.breakTickVolume),
  };
}

export function loadSettings(storage: Storage = window.localStorage): TimerSettings {
  try {
    const storedSettings = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!storedSettings) return DEFAULT_SETTINGS;
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TimerSettings, storage: Storage = window.localStorage): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
}

export function loadSession(
  settings: TimerSettings,
  storage: Storage = window.localStorage,
  now = Date.now(),
): TimerSession {
  try {
    const storedSessionJson = storage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionJson) {
      return createDefaultSession(settings);
    }

    const storedSession = JSON.parse(storedSessionJson) as Partial<TimerSession>;
    const status = isTimerStatus(storedSession.status) ? storedSession.status : 'idle';
    const deadline = typeof storedSession.deadline === 'number' ? storedSession.deadline : null;
    const completedIntervals = sanitizeNonNegativeInteger(storedSession.completedIntervals, 0);
    const defaultDurationMinutes = status === 'break-running' ? settings.breakMinutes : settings.workMinutes;
    const defaultRemainingMs = convertMinutesToMilliseconds(defaultDurationMinutes);
    const timerIsRunning = status === 'running' || status === 'break-running';
    const remainingMs = deadline && timerIsRunning
      ? Math.max(0, deadline - now)
      : sanitizeNonNegativeInteger(storedSession.remainingMs, defaultRemainingMs);

    return { status, remainingMs, completedIntervals, deadline };
  } catch {
    return createDefaultSession(settings);
  }
}

export function saveSession(session: TimerSession, storage: Storage = window.localStorage): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function createDefaultSession(settings: TimerSettings): TimerSession {
  return {
    status: 'idle',
    remainingMs: convertMinutesToMilliseconds(settings.workMinutes),
    completedIntervals: 0,
    deadline: null,
  };
}

function sanitizeNonNegativeInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle'
    || value === 'running'
    || value === 'paused'
    || value === 'ended'
    || value === 'break-due'
    || value === 'break-running'
    || value === 'break-complete';
}

export function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
