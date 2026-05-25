export type TimerMode = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended' | 'break-due' | 'break-complete';

export const DEFAULT_WORK_MINUTES = 5;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_INTERVALS_BEFORE_BREAK = 12;

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
