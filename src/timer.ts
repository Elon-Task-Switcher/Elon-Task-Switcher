export type TimerMode = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended' | 'break-due' | 'break-running' | 'break-complete';

export type TimerSettings = {
  workMinutes: number;
  breakMinutes: number;
  intervalsBeforeBreak: number;
};

export const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 5,
  breakMinutes: 5,
  intervalsBeforeBreak: 12,
};

export const SETTINGS_STORAGE_KEY = 'timeboucle.settings.v1';

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function sanitizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(180, Math.max(1, rounded));
}

export function sanitizeSettings(settings: TimerSettings): TimerSettings {
  return {
    workMinutes: sanitizePositiveInteger(settings.workMinutes, DEFAULT_SETTINGS.workMinutes),
    breakMinutes: sanitizePositiveInteger(settings.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
    intervalsBeforeBreak: sanitizePositiveInteger(settings.intervalsBeforeBreak, DEFAULT_SETTINGS.intervalsBeforeBreak),
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

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
