import { useEffect, useMemo, useRef, useState } from 'react';
import { BREAK_TICK_SOUND_PRESETS, REMINDER_SOUND_PRESETS, playReminderSound, startTickTock, stopTickTock } from './sound';
import {
  DEFAULT_SETTINGS,
  defaultSession,
  formatTime,
  loadSession,
  loadSettings,
  minutesToMs,
  saveSession,
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
    'break-due': 'Break starting',
    'break-running': 'Break',
    'break-complete': 'Break complete',
  };
  return labels[status];
}

function nextEvent(status: TimerStatus, autoStartNextWork: boolean): string {
  if (status === 'running' && autoStartNextWork) return 'Next task loop starts automatically when this one ends.';
  const labels: Record<TimerStatus, string> = {
    idle: 'Switch task when the timer ends.',
    running: 'Switch task when the timer ends.',
    paused: 'Resume when ready.',
    ended: 'Switch task, then continue to the next loop.',
    'break-due': 'Break starts automatically.',
    'break-running': 'Tick-tock plays during the break. Return to work when it ends.',
    'break-complete': 'Resume work loops.',
  };
  return labels[status];
}

function durationForStatus(settings: TimerSettings, status: TimerStatus): number {
  return minutesToMs(status === 'break-running' ? settings.breakMinutes : settings.workMinutes);
}

export function App() {
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());
  const initialSession = useMemo(() => loadSession(settings), []);
  const [status, setStatus] = useState<TimerStatus>(initialSession.status);
  const [remainingMs, setRemainingMs] = useState(initialSession.remainingMs);
  const [completedIntervals, setCompletedIntervals] = useState(initialSession.completedIntervals);
  const [audioMessage, setAudioMessage] = useState('');
  const [runId, setRunId] = useState(0);
  const deadlineRef = useRef<number | null>(initialSession.deadline);
  const statusRef = useRef<TimerStatus>(initialSession.status);
  const remainingRef = useRef(initialSession.remainingMs);
  const completedRef = useRef(initialSession.completedIntervals);
  const modeDurationMs = useMemo(() => durationForStatus(settings, status), [settings, status]);

  useEffect(() => {
    statusRef.current = status;
    remainingRef.current = remainingMs;
    completedRef.current = completedIntervals;
    saveSession({ status, remainingMs, completedIntervals, deadline: deadlineRef.current });
  }, [status, remainingMs, completedIntervals]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (status === 'idle') setRemainingMs(minutesToMs(settings.workMinutes));
    if (status === 'break-running') setRemainingMs((current) => Math.min(current, minutesToMs(settings.breakMinutes)));
  }, [settings, status]);

  useEffect(() => {
    if (status === 'break-running') {
      void startBreakTickTock();
    } else {
      stopTickTock();
    }

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
  }, [status, runId]);

  useEffect(() => () => stopTickTock(), []);

  async function ring() {
    const result = await playReminderSound(settings);
    setAudioMessage(result.ok ? '' : result.reason);
  }

  async function startBreakTickTock() {
    const result = await startTickTock(settings);
    if (!result.ok) setAudioMessage(result.reason);
  }

  async function handleTimerComplete(currentStatus: TimerStatus) {
    await ring();
    if (currentStatus === 'break-running') {
      stopTickTock();
      setCompletedIntervals(0);
      if (settings.autoStartNextWork) {
        const duration = minutesToMs(settings.workMinutes);
        setRemainingMs(duration);
        deadlineRef.current = Date.now() + duration;
        setRunId((id) => id + 1);
        setStatus('running');
        return;
      }
      setStatus('break-complete');
      setRemainingMs(0);
      return;
    }
    const nextCount = completedRef.current + 1;
    setCompletedIntervals(nextCount);
    if (nextCount >= settings.intervalsBeforeBreak) {
      startBreak();
      return;
    }

    if (settings.autoStartNextWork) {
      const duration = minutesToMs(settings.workMinutes);
      setRemainingMs(duration);
      deadlineRef.current = Date.now() + duration;
      setRunId((id) => id + 1);
      setStatus('running');
      return;
    }

    setRemainingMs(0);
    setStatus('ended');
  }

  function startWork() {
    const nextRemaining = remainingRef.current > 0 ? remainingRef.current : minutesToMs(settings.workMinutes);
    deadlineRef.current = Date.now() + nextRemaining;
    setRemainingMs(nextRemaining);
    setRunId((id) => id + 1);
    setStatus('running');
  }

  function pause() {
    if (status !== 'running' && status !== 'break-running') return;
    if (deadlineRef.current) setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
    stopTickTock();
    deadlineRef.current = null;
    setStatus('paused');
  }

  function reset() {
    stopTickTock();
    deadlineRef.current = null;
    setStatus('idle');
    setRemainingMs(minutesToMs(settings.workMinutes));
    setCompletedIntervals(0);
  }

  function continueNextWork() {
    stopTickTock();
    deadlineRef.current = null;
    setStatus('idle');
    setRemainingMs(minutesToMs(settings.workMinutes));
  }

  function startBreak() {
    const duration = minutesToMs(settings.breakMinutes);
    setRemainingMs(duration);
    deadlineRef.current = Date.now() + duration;
    setRunId((id) => id + 1);
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

  function updateSetting(key: keyof TimerSettings, value: number | boolean | string) {
    const next = sanitizeSettings({ ...settings, [key]: value });
    setSettings(next);
    if (statusRef.current === 'idle') setRemainingMs(minutesToMs(next.workMinutes));
  }

  function restoreDefaults() {
    const session = defaultSession(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    deadlineRef.current = session.deadline;
    setStatus(session.status);
    setRemainingMs(session.remainingMs);
    setCompletedIntervals(session.completedIntervals);
  }

  async function testBreakTick() {
    stopTickTock();
    const result = await startTickTock(settings);
    setAudioMessage(result.ok ? '' : result.reason);
    window.setTimeout(() => stopTickTock(), 2500);
  }

  const canStart = status === 'idle' || status === 'ended' || status === 'break-complete';
  const canPause = status === 'running' || status === 'break-running';
  const canReset = status !== 'idle' || remainingMs !== modeDurationMs || completedIntervals !== 0;

  return (
    <main className="app-shell" data-status={status}>
      <section className="timer-card" aria-labelledby="app-title">
        <p className="eyebrow">Elon Task Switcher</p>
        <h1 id="app-title">Task switching timer</h1>
        <p className="mode-label" aria-live="polite">{statusLabel(status)}</p>
        <div className="countdown" aria-label="Time remaining">{formatTime(remainingMs)}</div>
        <p className="next-event">{nextEvent(status, settings.autoStartNextWork)}</p>
        <p className="interval-count">Completed intervals: {completedIntervals} / {settings.intervalsBeforeBreak}</p>

        {audioMessage ? <p role="alert" className="audio-message">{audioMessage}</p> : null}

        <div className="primary-actions" aria-label="Timer controls">
          {canStart ? <button type="button" onClick={startWork}>Start</button> : null}
          {status === 'paused' ? <button type="button" onClick={startWork}>Resume</button> : null}
          <button type="button" onClick={pause} disabled={!canPause}>Pause</button>
          <button type="button" onClick={reset} disabled={!canReset}>Reset</button>
          {status === 'ended' ? <button type="button" onClick={continueNextWork}>Next loop</button> : null}
          {status === 'break-complete' ? <button type="button" onClick={finishBreakCycle}>Resume work</button> : null}
          <button type="button" className="secondary" onClick={() => void ring()}>Test Reminder</button>
          <button type="button" className="secondary" onClick={() => void testBreakTick()}>Test Break Tick</button>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-title">
        <h2 id="settings-title">Settings</h2>
        <label>
          Work duration (minutes)
          <input type="number" min="0.05" step="0.05" max="180" value={settings.workMinutes} onChange={(event) => updateSetting('workMinutes', Number(event.target.value))} />
        </label>
        <label>
          Break duration (minutes)
          <input type="number" min="0.05" step="0.05" max="180" value={settings.breakMinutes} onChange={(event) => updateSetting('breakMinutes', Number(event.target.value))} />
        </label>
        <label>
          Intervals before break
          <input type="number" min="1" max="180" value={settings.intervalsBeforeBreak} onChange={(event) => updateSetting('intervalsBeforeBreak', Number(event.target.value))} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={settings.autoStartNextWork} onChange={(event) => updateSetting('autoStartNextWork', event.target.checked)} />
          Auto-start next task loop
        </label>
        <fieldset className="sound-settings">
          <legend>Sound settings</legend>
          <label>
            Task switch sound
            <select value={settings.reminderSoundId} onChange={(event) => updateSetting('reminderSoundId', event.target.value)}>
              {REMINDER_SOUND_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label>
            Task switch volume: {Math.round(settings.reminderVolume * 100)}%
            <input type="range" min="0" max="1" step="0.05" value={settings.reminderVolume} onChange={(event) => updateSetting('reminderVolume', Number(event.target.value))} />
          </label>
          <label>
            Break tick sound
            <select value={settings.breakTickSoundId} onChange={(event) => updateSetting('breakTickSoundId', event.target.value)}>
              {BREAK_TICK_SOUND_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label>
            Break tick volume: {Math.round(settings.breakTickVolume * 100)}%
            <input type="range" min="0" max="1" step="0.05" value={settings.breakTickVolume} onChange={(event) => updateSetting('breakTickVolume', Number(event.target.value))} />
          </label>
        </fieldset>
        <button type="button" className="secondary" onClick={restoreDefaults}>Restore Defaults</button>
      </section>
    </main>
  );
}

