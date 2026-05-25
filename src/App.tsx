import { DEFAULT_WORK_MINUTES, formatTime, minutesToMs, type TimerStatus } from './timer';

function getStatusLabel(status: TimerStatus): string {
  if (status === 'idle') return 'Work';
  if (status === 'running') return 'Work running';
  if (status === 'paused') return 'Paused';
  if (status === 'ended') return 'Switch task';
  if (status === 'break-due') return 'Break due';
  if (status === 'break-complete') return 'Break complete';
  return 'Work';
}

function getNextEvent(status: TimerStatus): string {
  if (status === 'ended') return 'Switch task, then continue to the next loop.';
  if (status === 'paused') return 'Resume when ready.';
  if (status === 'break-due') return 'Start a break or skip it.';
  if (status === 'break-complete') return 'Resume work loops.';
  return 'Switch task when the timer ends.';
}

export function App() {
  const status: TimerStatus = 'idle';
  const remainingMs = minutesToMs(DEFAULT_WORK_MINUTES);

  return (
    <main className="app-shell" data-status={status}>
      <section className="timer-card" aria-labelledby="app-title">
        <p className="eyebrow">TimeBoucle</p>
        <h1 id="app-title">Task switching timer</h1>
        <p className="mode-label" aria-live="polite">{getStatusLabel(status)}</p>
        <div className="countdown" aria-label="Time remaining">{formatTime(remainingMs)}</div>
        <p className="next-event">{getNextEvent(status)}</p>
        <div className="primary-actions" aria-label="Timer controls">
          <button type="button">Start</button>
          <button type="button" disabled>Pause</button>
          <button type="button" disabled>Reset</button>
        </div>
      </section>
    </main>
  );
}
