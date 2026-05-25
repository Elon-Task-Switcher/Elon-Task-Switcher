import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the default work timer on load', () => {
    render(<App />);

    expect(screen.getByText('TimeBoucle')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    expect(screen.getByText(/Switch task when the timer ends/i)).toBeInTheDocument();
  });
});
