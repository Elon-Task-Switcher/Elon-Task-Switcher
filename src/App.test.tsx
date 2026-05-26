import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('shows the default work timer on load', () => {
    render(<App />);
    expect(screen.getByText('Elon Task Switcher')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    expect(screen.getByText(/Switch task when the timer ends/i)).toBeInTheDocument();
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
    expect(screen.getByText('Work running')).toBeInTheDocument();
  });
});


