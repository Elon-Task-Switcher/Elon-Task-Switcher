import { useEffect, useMemo, useRef, useState } from 'react';
import { playReminderSound } from './sound';
import {
  DEFAULT_SETTINGS,
  formatTime,
  loadSettings,
  minutesToMs,
  saveSettings,
  sanitizeSettings,
  type TimerSettings,
  type TimerStatus,
} from './timer';

function statusLabel(status: TimerStatus): string {
  const labels: Record<TimerStatus, string> = {
    idle: 'Work',
    running: 'Work running',
    paused: 'Paused',
    ended: 'Switch task',
    'break-due': 'Break due',
    'break-running': 'Break',
    'break-complete': 'Break complete',
  };
  return labels[status];
}

function nextEvent(status: TimerStatus): string {
  const labels: Record<TimerStatus, string> = {
    idle: 'Switch task when the timer ends.',
    running: 'Switch task when the timer ends.',
    paused: 'Resume when ready.',
    ended: 'Switch task, then continue to the next loop.',
    'break-due': 'Start a break or skip it.',
    'break-running': 'Return to work when the break ends.',
    'break-complete': 'Resume work loops.',
  };
  return labels[status];
}

function durationForStatus(settings: TimerSettings, status: TimerStatus): number {
  return minutesToMs(status === 'break-running' ? settings.breakMinutes : settings.workMinutes);
}

export function App() {
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(() => minutesToMs(settings.workMinutes));
  const [completedIntervals, setCompletedIntervals] = useState(0);
  const [audioMessage, setAudioMessage] = useState('');
  const deadlineRef = useRef<number | null>(null);
  const modeDurationMs = useMemo(() => durationForStatus(settings, status), [settings, status]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (status === 'idle') setRemainingMs(minutesToMs(settings.workMinutes));
    if (status === 'break-running') setRemainingMs((current) => Math.min(current, minutesToMs(settings.breakMinutes)));
  }, [settings, status]);

  useEffect(() => {
    if (status !== 'running' && status !== 'break-running') return;
    if (!deadlineRef.current) deadlineRef.current = Date.now() + remainingMs;

    const interval = window.setInterval(() => {
      const nextRemaining = Math.max(0, (deadlineRef.current ?? Date.now()) - Date.now());
      setRemainingMs(nextRemaining);
      if (nextRemaining <= 0) {
        window.clearInterval(interval);
        deadlineRef.current = null;
        void handleTimerComplete(status);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [status]);

  async function ring() {
    const result = await playReminderSound();
    setAudioMessage(result.ok ? '' : result.reason);
  }

  async function handleTimerComplete(currentStatus: TimerStatus) {
    await ring();
    if (currentStatus === 'break-running') {
      setStatus('break-complete');
      setRemainingMs(0);
      return;
    }

    const nextCount = completedIntervals + 1;
    setCompletedIntervals(nextCount);
    setRemainingMs(0);
    if (nextCount >= settings.intervalsBeforeBreak) {
      setStatus('break-due');
    } else {
      setStatus('ended');
    }
  }

  function startWork() {
    deadlineRef.current = Date.now() + (remainingMs > 0 ? remainingMs : minutesToMs(settings.workMinutes));
    setRemainingMs((current) => (current > 0 ? current : minutesToMs(settings.workMinutes)));
    setStatus('running');
  }

  function pause() {
    if (status !== 'running' && status !== 'break-running') return;
    if (deadlineRef.current) setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
    deadlineRef.current = null;
    setStatus('paused');
  }

  function reset() {
    deadlineRef.current = null;
    setStatus('idle');
    setRemainingMs(minutesToMs(settings.workMinutes));
  }

  function continueNextWork() {
    deadlineRef.current = null;
    setStatus('idle');
    setRemainingMs(minutesToMs(settings.workMinutes));
  }

  function startBreak() {
    const duration = minutesToMs(settings.breakMinutes);
    setRemainingMs(duration);
    deadlineRef.current = Date.now() + duration;
    setStatus('break-running');
  }

  function finishBreakCycle() {
    setCompletedIntervals(0);
    continueNextWork();
  }

  function skipBreak() {
    setCompletedIntervals(0);
    continueNextWork();
  }

  function updateSetting(key: keyof TimerSettings, value: number) {
    const next = sanitizeSettings({ ...settings, [key]: value });
    setSettings(next);
    if (status === 'idle') setRemainingMs(minutesToMs(next.workMinutes));
  }

  function restoreDefaults() {
    setSettings(DEFAULT_SETTINGS);
    deadlineRef.current = null;
    setStatus('idle');
    setRemainingMs(minutesToMs(DEFAULT_SETTINGS.workMinutes));
    setCompletedIntervals(0);
  }

  const canStart = status === 'idle' || status === 'ended' || status === 'break-complete';
  const canPause = status === 'running' || status === 'break-running';
  const canReset = status !== 'idle' || remainingMs !== modeDurationMs;

  return (
    <main className="app-shell" data-status={status}>
      <section className="timer-card" aria-labelledby="app-title">
        <p className="eyebrow">TimeBoucle</p>
        <h1 id="app-title">Task switching timer</h1>
        <p className="mode-label" aria-live="polite">{statusLabel(status)}</p>
        <div className="countdown" aria-label="Time remaining">{formatTime(remainingMs)}</div>
        <p className="next-event">{nextEvent(status)}</p>
        <p className="interval-count">Completed intervals: {completedIntervals} / {settings.intervalsBeforeBreak}</p>

        {audioMessage ? <p role="alert" className="audio-message">{audioMessage}</p> : null}

        <div className="primary-actions" aria-label="Timer controls">
          {canStart ? <button type="button" onClick={startWork}>Start</button> : null}
          {status === 'paused' ? <button type="button" onClick={startWork}>Resume</button> : null}
          <button type="button" onClick={pause} disabled={!canPause}>Pause</button>
          <button type="button" onClick={reset} disabled={!canReset}>Reset</button>
          {status === 'ended' ? <button type="button" onClick={continueNextWork}>Next loop</button> : null}
          {status === 'break-due' ? <button type="button" onClick={startBreak}>Start break</button> : null}
          {status === 'break-due' ? <button type="button" onClick={skipBreak}>Skip break</button> : null}
          {status === 'break-complete' ? <button type="button" onClick={finishBreakCycle}>Resume work</button> : null}
          <button type="button" className="secondary" onClick={() => void ring()}>Test Sound</button>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-title">
        <h2 id="settings-title">Settings</h2>
        <label>
          Work duration (minutes)
          <input type="number" min="1" max="180" value={settings.workMinutes} onChange={(event) => updateSetting('workMinutes', Number(event.target.value))} />
        </label>
        <label>
          Break duration (minutes)
          <input type="number" min="1" max="180" value={settings.breakMinutes} onChange={(event) => updateSetting('breakMinutes', Number(event.target.value))} />
        </label>
        <label>
          Intervals before break
          <input type="number" min="1" max="180" value={settings.intervalsBeforeBreak} onChange={(event) => updateSetting('intervalsBeforeBreak', Number(event.target.value))} />
        </label>
        <button type="button" className="secondary" onClick={restoreDefaults}>Restore Defaults</button>
      </section>
    </main>
  );
}
