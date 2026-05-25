import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText('TimeBoucle')).toBeInTheDocument();
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
    await user.click(screen.getByLabelText(/Auto-start next task loop/i));
    expect(localStorage.getItem('timeboucle.settings.v1')).toContain('7');
    expect(localStorage.getItem('timeboucle.settings.v1')).toContain('autoStartNextWork');
    unmount();
    render(<App />);
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('07:00');
    expect(screen.getByLabelText(/Auto-start next task loop/i)).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Restore Defaults' }));
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    expect(screen.getByLabelText(/Auto-start next task loop/i)).not.toBeChecked();
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
});
