export type TimerMode = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended' | 'break-due' | 'break-running' | 'break-complete';

export type TimerSettings = {
  workMinutes: number;
  breakMinutes: number;
  intervalsBeforeBreak: number;
  autoStartNextWork: boolean;
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
};

export const SETTINGS_STORAGE_KEY = 'elon-task-switcher.settings.v1';
export const SESSION_STORAGE_KEY = 'elon-task-switcher.session.v1';

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function sanitizePositiveNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(180, Math.max(0.05, value));
}
export function sanitizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(180, Math.max(1, rounded));
}

export function sanitizeSettings(settings: Partial<TimerSettings>): TimerSettings {
  return {
    workMinutes: sanitizePositiveNumber(settings.workMinutes ?? DEFAULT_SETTINGS.workMinutes, DEFAULT_SETTINGS.workMinutes),
    breakMinutes: sanitizePositiveNumber(settings.breakMinutes ?? DEFAULT_SETTINGS.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
    intervalsBeforeBreak: sanitizePositiveInteger(settings.intervalsBeforeBreak ?? DEFAULT_SETTINGS.intervalsBeforeBreak, DEFAULT_SETTINGS.intervalsBeforeBreak),
    autoStartNextWork: Boolean(settings.autoStartNextWork ?? DEFAULT_SETTINGS.autoStartNextWork),
  };
}

export function loadSettings(storage: Storage = window.localStorage): TimerSettings {
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TimerSettings, storage: Storage = window.localStorage): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
}

export function loadSession(settings: TimerSettings, storage: Storage = window.localStorage, now = Date.now()): TimerSession {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return defaultSession(settings);
    }

    const parsed = JSON.parse(raw) as Partial<TimerSession>;
    const status = isTimerStatus(parsed.status) ? parsed.status : 'idle';
    const deadline = typeof parsed.deadline === 'number' ? parsed.deadline : null;
    const completedIntervals = sanitizeNonNegativeInteger(parsed.completedIntervals, 0);
    const fallbackRemaining = status === 'break-running' ? minutesToMs(settings.breakMinutes) : minutesToMs(settings.workMinutes);
    const remainingMs = deadline && (status === 'running' || status === 'break-running')
      ? Math.max(0, deadline - now)
      : sanitizeNonNegativeInteger(parsed.remainingMs, fallbackRemaining);

    return { status, remainingMs, completedIntervals, deadline };
  } catch {
    return defaultSession(settings);
  }
}

export function saveSession(session: TimerSession, storage: Storage = window.localStorage): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function defaultSession(settings: TimerSettings): TimerSession {
  return {
    status: 'idle',
    remainingMs: minutesToMs(settings.workMinutes),
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

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
