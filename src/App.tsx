import { useEffect, useMemo, useRef, useState } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { playReminderSound, startBreakTickSound, stopBreakTickSound, unlockAudio } from './sound';
import {
  DEFAULT_SETTINGS,
  convertMinutesToMilliseconds,
  createDefaultSession,
  formatRemainingTime,
  loadSession,
  loadSettings,
  saveSession,
  saveSettings,
  sanitizeSettings,
  type TimerSettings,
  type TimerStatus,
} from './timer';
import { APP_VERSION } from './version';

const PROJECT_LINKS = [
  {
    label: 'Source code',
    href: 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher',
  },
  {
    label: 'Report an issue',
    href: 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/issues',
  },
  {
    label: 'MIT license',
    href: 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/blob/main/LICENSE',
  },
] as const;

function describeTimerStatus(status: TimerStatus): string {
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

function describeNextTimerEvent(status: TimerStatus, autoStartNextWork: boolean): string {
  if (status === 'running' && autoStartNextWork) {
    return 'Next task loop starts automatically when this one ends.';
  }
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

function calculateTimerDuration(settings: TimerSettings, status: TimerStatus): number {
  return convertMinutesToMilliseconds(status === 'break-running' ? settings.breakMinutes : settings.workMinutes);
}

function browserSupportsNotifications(): boolean {
  return 'Notification' in window;
}

export function App() {
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());
  const initialSession = useMemo(() => loadSession(settings), []);
  const [status, setStatus] = useState<TimerStatus>(initialSession.status);
  const [remainingMs, setRemainingMs] = useState(initialSession.remainingMs);
  const [completedIntervals, setCompletedIntervals] = useState(initialSession.completedIntervals);
  const [audioMessage, setAudioMessage] = useState('');
  const [switchAlertVisible, setSwitchAlertVisible] = useState(false);
  const [timerRunId, setTimerRunId] = useState(0);
  const deadlineMsRef = useRef<number | null>(initialSession.deadline);
  const timerStatusRef = useRef<TimerStatus>(initialSession.status);
  const remainingMsRef = useRef(initialSession.remainingMs);
  const completedIntervalsRef = useRef(initialSession.completedIntervals);
  const isCompletingTimerRef = useRef(false);
  const timerDurationMs = useMemo(() => calculateTimerDuration(settings, status), [settings, status]);

  useEffect(() => {
    timerStatusRef.current = status;
    remainingMsRef.current = remainingMs;
    completedIntervalsRef.current = completedIntervals;
    saveSession({ status, remainingMs, completedIntervals, deadline: deadlineMsRef.current });
  }, [status, remainingMs, completedIntervals]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!switchAlertVisible) return;
    const switchAlertTimeoutId = window.setTimeout(() => setSwitchAlertVisible(false), 10_000);
    return () => window.clearTimeout(switchAlertTimeoutId);
  }, [switchAlertVisible]);

  useEffect(() => {
    if (status === 'idle') {
      setRemainingMs(convertMinutesToMilliseconds(settings.workMinutes));
    }
    if (status === 'break-running') {
      setRemainingMs((currentRemainingMs) => (
        Math.min(currentRemainingMs, convertMinutesToMilliseconds(settings.breakMinutes))
      ));
    }
  }, [settings, status]);

  useEffect(() => {
    const completeVisibleTimerIfDue = () => {
      if (document.hidden) return;
      completeTimerIfDue();
    };

    document.addEventListener('visibilitychange', completeVisibleTimerIfDue);
    window.addEventListener('focus', completeVisibleTimerIfDue);

    return () => {
      document.removeEventListener('visibilitychange', completeVisibleTimerIfDue);
      window.removeEventListener('focus', completeVisibleTimerIfDue);
    };
  });

  useEffect(() => {
    if (status === 'break-running') {
      void playBreakTicksAndReportFailure();
    } else {
      stopBreakTickSound();
    }

    if (status !== 'running' && status !== 'break-running') return;
    if (!deadlineMsRef.current) deadlineMsRef.current = Date.now() + remainingMs;

    const countdownIntervalId = window.setInterval(() => {
      const nextRemainingMs = Math.max(0, (deadlineMsRef.current ?? Date.now()) - Date.now());
      setRemainingMs(nextRemainingMs);
      if (nextRemainingMs <= 0 && completeTimerIfDue()) {
        window.clearInterval(countdownIntervalId);
      }
    }, 250);

    return () => window.clearInterval(countdownIntervalId);
  }, [status, timerRunId]);

  useEffect(() => () => stopBreakTickSound(), []);

  async function playReminderAndReportFailure() {
    const result = await playReminderSound(settings);
    setAudioMessage(result.ok ? '' : result.reason);
  }

  async function unlockAudioForSession() {
    const result = await unlockAudio();
    if (!result.ok) setAudioMessage(result.reason);
  }

  function requestNotificationPermission() {
    if (browserSupportsNotifications() && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }

  function notifyTimerCompletion(currentStatus: TimerStatus) {
    if (!document.hidden || !browserSupportsNotifications() || Notification.permission !== 'granted') return;
    const title = currentStatus === 'break-running' ? 'Break complete' : 'Timer fini';
    const body = currentStatus === 'break-running' ? 'Return to work.' : 'Change de tache maintenant.';
    try {
      new Notification(title, { body });
    } catch {
      // Notification support varies by browser and context; visual and audio cues still run.
    }
  }

  async function playBreakTicksAndReportFailure() {
    const result = await startBreakTickSound(settings);
    if (!result.ok) setAudioMessage(result.reason);
  }

  function startNewWorkInterval() {
    const workDurationMs = convertMinutesToMilliseconds(settings.workMinutes);
    setRemainingMs(workDurationMs);
    deadlineMsRef.current = Date.now() + workDurationMs;
    setTimerRunId((currentRunId) => currentRunId + 1);
    setStatus('running');
  }

  function handleTimerCompletion(currentStatus: TimerStatus) {
    notifyTimerCompletion(currentStatus);
    void playReminderAndReportFailure();
    if (currentStatus === 'running') setSwitchAlertVisible(true);
    if (currentStatus === 'break-running') {
      stopBreakTickSound();
      setCompletedIntervals(0);
      if (settings.autoStartNextWork) {
        startNewWorkInterval();
        return;
      }
      setStatus('break-complete');
      setRemainingMs(0);
      return;
    }
    const completedWorkIntervals = completedIntervalsRef.current + 1;
    setCompletedIntervals(completedWorkIntervals);
    if (completedWorkIntervals >= settings.intervalsBeforeBreak) {
      startBreak();
      return;
    }

    if (settings.autoStartNextWork) {
      startNewWorkInterval();
      return;
    }

    setRemainingMs(0);
    setStatus('ended');
  }

  function completeTimerIfDue(): boolean {
    if (isCompletingTimerRef.current) return false;
    const currentStatus = timerStatusRef.current;
    if (currentStatus !== 'running' && currentStatus !== 'break-running') return false;
    const deadline = deadlineMsRef.current;
    if (!deadline || deadline > Date.now()) return false;

    isCompletingTimerRef.current = true;
    deadlineMsRef.current = null;
    setRemainingMs(0);
    try {
      handleTimerCompletion(currentStatus);
    } finally {
      isCompletingTimerRef.current = false;
    }
    return true;
  }

  function startOrResumeWork() {
    requestNotificationPermission();
    void unlockAudioForSession();
    setSwitchAlertVisible(false);
    const nextRemainingMs = remainingMsRef.current > 0
      ? remainingMsRef.current
      : convertMinutesToMilliseconds(settings.workMinutes);
    deadlineMsRef.current = Date.now() + nextRemainingMs;
    setRemainingMs(nextRemainingMs);
    setTimerRunId((currentRunId) => currentRunId + 1);
    setStatus('running');
  }

  function pauseTimer() {
    if (status !== 'running' && status !== 'break-running') return;
    if (deadlineMsRef.current) {
      setRemainingMs(Math.max(0, deadlineMsRef.current - Date.now()));
    }
    stopBreakTickSound();
    deadlineMsRef.current = null;
    setStatus('paused');
  }

  function resetTimer() {
    isCompletingTimerRef.current = false;
    setSwitchAlertVisible(false);
    stopBreakTickSound();
    deadlineMsRef.current = null;
    setStatus('idle');
    setRemainingMs(convertMinutesToMilliseconds(settings.workMinutes));
    setCompletedIntervals(0);
  }

  function prepareNextWorkInterval() {
    setSwitchAlertVisible(false);
    stopBreakTickSound();
    deadlineMsRef.current = null;
    setStatus('idle');
    setRemainingMs(convertMinutesToMilliseconds(settings.workMinutes));
  }

  function startBreak() {
    const breakDurationMs = convertMinutesToMilliseconds(settings.breakMinutes);
    setRemainingMs(breakDurationMs);
    deadlineMsRef.current = Date.now() + breakDurationMs;
    setTimerRunId((currentRunId) => currentRunId + 1);
    setStatus('break-running');
  }

  function resumeWorkAfterBreak() {
    setCompletedIntervals(0);
    prepareNextWorkInterval();
  }

  function updateSetting(settingName: keyof TimerSettings, value: number | boolean | string) {
    const nextSettings = sanitizeSettings({ ...settings, [settingName]: value });
    setSettings(nextSettings);
    if (timerStatusRef.current === 'idle') {
      setRemainingMs(convertMinutesToMilliseconds(nextSettings.workMinutes));
    }
  }

  function restoreDefaultSettings() {
    const session = createDefaultSession(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    deadlineMsRef.current = session.deadline;
    setStatus(session.status);
    setRemainingMs(session.remainingMs);
    setCompletedIntervals(session.completedIntervals);
  }

  async function previewBreakTickSound() {
    stopBreakTickSound();
    void unlockAudioForSession();
    const result = await startBreakTickSound(settings);
    setAudioMessage(result.ok ? '' : result.reason);
    window.setTimeout(() => stopBreakTickSound(), 2500);
  }

  const canStart = status === 'idle' || status === 'ended' || status === 'break-complete';
  const canPause = status === 'running' || status === 'break-running';
  const canReset = status !== 'idle' || remainingMs !== timerDurationMs || completedIntervals !== 0;

  return (
    <main className="app-shell" data-status={status}>
      <section
        className={switchAlertVisible ? 'timer-card timer-card-alert' : 'timer-card'}
        aria-labelledby="app-title"
      >
        <p className="eyebrow">Elon Task Switcher</p>
        <h1 id="app-title">Task switching timer</h1>
        <p className="mode-label" aria-live="polite">{describeTimerStatus(status)}</p>
        <div className="countdown" aria-label="Time remaining">{formatRemainingTime(remainingMs)}</div>
        <p className="next-event">{describeNextTimerEvent(status, settings.autoStartNextWork)}</p>
        {switchAlertVisible ? (
          <p className="switch-alert" role="alert" aria-live="assertive">Timer fini - change de tache maintenant</p>
        ) : null}
        <p className="interval-count">Completed intervals: {completedIntervals} / {settings.intervalsBeforeBreak}</p>

        {audioMessage ? <p role="alert" className="audio-message">{audioMessage}</p> : null}

        <div className="primary-actions" aria-label="Timer controls">
          {canStart ? <button type="button" onClick={startOrResumeWork}>Start</button> : null}
          {status === 'paused' ? (
            <button type="button" onClick={startOrResumeWork}>Resume</button>
          ) : null}
          <button type="button" onClick={pauseTimer} disabled={!canPause}>Pause</button>
          <button type="button" onClick={resetTimer} disabled={!canReset}>Reset</button>
          {status === 'ended' ? (
            <button type="button" onClick={prepareNextWorkInterval}>Next loop</button>
          ) : null}
          {status === 'break-complete' ? (
            <button type="button" onClick={resumeWorkAfterBreak}>Resume work</button>
          ) : null}
          <button type="button" className="secondary" onClick={() => void playReminderAndReportFailure()}>
            Test Reminder
          </button>
          <button type="button" className="secondary" onClick={() => void previewBreakTickSound()}>
            Test Break Tick
          </button>
        </div>
      </section>

      <SettingsPanel
        settings={settings}
        onSettingChange={updateSetting}
        onRestoreDefaults={restoreDefaultSettings}
      />

      <section className="project-card" aria-labelledby="project-links-title">
        <p className="eyebrow">Open source</p>
        <h2 id="project-links-title">GitHub project links</h2>
        <p className="project-summary">
          Follow the code, report bugs, or check the license directly from the timer interface.
        </p>
        <p className="app-version" aria-label="App version">Version {APP_VERSION}</p>
        <div className="git-links" aria-label="GitHub links">
          {PROJECT_LINKS.map((link) => (
            <a key={link.href} className="git-link" href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
