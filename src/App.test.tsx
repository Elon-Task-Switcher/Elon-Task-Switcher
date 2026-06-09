import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import packageJson from '../package.json';
import { App } from './App';
import { SESSION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './timer';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows the default work timer on load', () => {
    render(<App />);
    expect(screen.getByText('Elon Task Switcher')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    expect(screen.getByText(/Switch task when the timer ends/i)).toBeInTheDocument();
    expect(screen.getByLabelText('App version')).toHaveTextContent(`Version ${packageJson.version}`);
    expect(screen.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher');
    expect(screen.getByRole('link', { name: 'Report an issue' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/issues');
    expect(screen.getByRole('link', { name: 'MIT license' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/blob/main/LICENSE');
  });

  it('starts, pauses, resumes, and resets the timer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('Work running')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Paused')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByText('Work running')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
  });

  it('persists configurable settings and restores defaults', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByLabelText(/Work duration/i));
    await user.keyboard('{Control>}a{/Control}7');
    expect(screen.getByLabelText(/Auto-start next task loop/i)).toBeChecked();
    expect(localStorage.getItem('elon-task-switcher.settings.v1')).toContain('7');
    expect(localStorage.getItem('elon-task-switcher.settings.v1')).toContain('autoStartNextWork');
    expect(screen.getByLabelText(/Task switch sound/i)).toHaveValue('bell');
    expect(screen.getByLabelText(/Break tick sound/i)).toHaveValue('classic-tick');
    unmount();
    render(<App />);
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('07:00');
    expect(screen.getByLabelText(/Auto-start next task loop/i)).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Restore Defaults' }));
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    expect(screen.getByLabelText(/Auto-start next task loop/i)).toBeChecked();
    await user.selectOptions(screen.getByLabelText(/Task switch sound/i), 'alarm');
    await user.selectOptions(screen.getByLabelText(/Break tick sound/i), 'digital');
    expect(localStorage.getItem('elon-task-switcher.settings.v1')).toContain('alarm');
    expect(localStorage.getItem('elon-task-switcher.settings.v1')).toContain('digital');
  });

  it('persists session state across reloads', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('Work running')).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(screen.getByText('Work running')).toBeInTheDocument();
  });

  it('shows a temporary visual switch alert when a work interval ends with auto-start enabled', async () => {
    vi.useFakeTimers();
    localStorage.setItem('elon-task-switcher.settings.v1', JSON.stringify({
      workMinutes: 0.05,
      breakMinutes: 5,
      intervalsBeforeBreak: 12,
      autoStartNextWork: true,
      reminderSoundId: 'silent',
      breakTickSoundId: 'silent',
      reminderVolume: 0.85,
      breakTickVolume: 0.45,
    }));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(3250);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Timer fini/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.queryByText(/Timer fini/i)).not.toBeInTheDocument();
    expect(screen.getByText('Work running')).toBeInTheDocument();
  });

  it('catches up an overdue timer when the window regains focus', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    localStorage.setItem('elon-task-switcher.settings.v1', JSON.stringify({
      workMinutes: 0.05,
      breakMinutes: 5,
      intervalsBeforeBreak: 12,
      autoStartNextWork: true,
      reminderSoundId: 'silent',
      breakTickSoundId: 'silent',
      reminderVolume: 0.85,
      breakTickVolume: 0.45,
    }));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    vi.setSystemTime(new Date('2026-01-01T00:00:04Z'));
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    expect(screen.getByText(/Timer fini/i)).toBeInTheDocument();
    expect(screen.getByText('Work running')).toBeInTheDocument();
  });

  it('recovers a persisted 00:00 running timer even when browser audio is blocked', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));

    class HangingAudioContext {
      state = 'suspended';
      currentTime = 0;
      resume = () => new Promise<void>(() => {});
      close = () => Promise.resolve();
    }

    vi.stubGlobal('AudioContext', HangingAudioContext);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      workMinutes: 0.05,
      breakMinutes: 5,
      intervalsBeforeBreak: 12,
      autoStartNextWork: true,
      reminderSoundId: 'bell',
      breakTickSoundId: 'silent',
      reminderVolume: 0.85,
      breakTickVolume: 0.45,
    }));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      status: 'running',
      remainingMs: 0,
      completedIntervals: 0,
      deadline: null,
    }));

    render(<App />);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Timer fini/i)).toBeInTheDocument();
    expect(screen.getByText('Work running')).toBeInTheDocument();
    expect(screen.getByText('Completed intervals: 1 / 12')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).not.toHaveTextContent('00:00');
  });

  it('unlocks audio on start and reuses the same AudioContext for the timer reminder', async () => {
    vi.useFakeTimers();
    let createdContexts = 0;
    const resumeAudio = vi.fn();

    class ReusableAudioContext {
      state: AudioContextState = 'suspended';
      currentTime = 0;
      destination = {};

      constructor() {
        createdContexts += 1;
      }

      resume = vi.fn(async () => {
        this.state = 'running';
        resumeAudio();
      });

      close = vi.fn(async () => {
        this.state = 'closed';
      });

      createOscillator = vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }));

      createGain = vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }));
    }

    vi.stubGlobal('AudioContext', ReusableAudioContext);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      workMinutes: 0.05,
      breakMinutes: 5,
      intervalsBeforeBreak: 12,
      autoStartNextWork: true,
      reminderSoundId: 'bell',
      breakTickSoundId: 'silent',
      reminderVolume: 0.85,
      breakTickVolume: 0.45,
    }));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(createdContexts).toBe(1);
    expect(resumeAudio).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3250);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Timer fini/i)).toBeInTheDocument();
    expect(screen.getByText('Work running')).toBeInTheDocument();
    expect(createdContexts).toBe(1);
  });
});


