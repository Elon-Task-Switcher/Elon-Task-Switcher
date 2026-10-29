import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const soundSettings = {
  reminderSoundId: 'bell' as const,
  breakTickSoundId: 'classic-tick' as const,
  reminderVolume: 0.85,
  breakTickVolume: 0.45,
};

function createTestAudioContext() {
  const context = {
    state: 'suspended',
    currentTime: 10,
    destination: {},
    resume: vi.fn(async () => { context.state = 'running'; }),
    close: vi.fn(async () => { context.state = 'closed'; }),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
  };
  return context;
}

let sound: typeof import('./sound');

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal('AudioContext', undefined);
  vi.stubGlobal('webkitAudioContext', undefined);
  sound = await import('./sound');
});

afterEach(() => {
  sound.stopBreakTickSound();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('reminder playback', () => {
  it('does not require audio support for silence or zero volume', async () => {
    expect(await sound.playReminderSound({ ...soundSettings, reminderSoundId: 'silent' })).toEqual({ ok: true });
    expect(await sound.playReminderSound({ ...soundSettings, reminderVolume: 0 })).toEqual({ ok: true });
    expect(await sound.startBreakTickSound({ ...soundSettings, breakTickSoundId: 'silent' })).toEqual({ ok: true });
    expect(await sound.startBreakTickSound({ ...soundSettings, breakTickVolume: 0 })).toEqual({ ok: true });
    expect(await sound.unlockAudio()).toEqual({ ok: false, reason: 'Audio is not supported in this browser.' });
  });

  it('reports blocked audio without throwing', async () => {
    const context = createTestAudioContext();
    context.resume.mockRejectedValue(new Error('blocked'));
    vi.stubGlobal('AudioContext', vi.fn(function () { return context; }));
    expect(await sound.playReminderSound(soundSettings)).toEqual({
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    });
  });

  it('reuses the unlocked context and schedules the original bell notes and gain ramps', async () => {
    const context = createTestAudioContext();
    const AudioContextConstructor = vi.fn(function () { return context; });
    vi.stubGlobal('AudioContext', AudioContextConstructor);
    expect(await sound.unlockAudio()).toEqual({ ok: true });
    expect(await sound.playReminderSound(soundSettings)).toEqual({ ok: true });
    expect(AudioContextConstructor).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);

    const firstNote = context.createOscillator.mock.results[0].value;
    const secondNote = context.createOscillator.mock.results[1].value;
    expect(firstNote.type).toBe('triangle');
    expect(firstNote.frequency.setValueAtTime).toHaveBeenCalledWith(784, 10);
    expect(firstNote.start).toHaveBeenCalledWith(10);
    expect(firstNote.stop).toHaveBeenCalledWith(10.7);
    expect(secondNote.type).toBe('sine');
    expect(secondNote.frequency.setValueAtTime).toHaveBeenCalledWith(1175, 10.18);
    expect(secondNote.stop).toHaveBeenCalledWith(10.18 + 1.1);
    const firstGain = context.createGain.mock.results[0].value;
    expect(firstGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 10);
    expect(firstGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.28 * 0.85, 10.01);
    expect(firstGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.7);
    expect(firstNote.connect).toHaveBeenCalledWith(firstGain);
    expect(firstGain.connect).toHaveBeenCalledWith(context.destination);
  });

  it('supports the browser-prefixed context constructor', async () => {
    const context = createTestAudioContext();
    vi.stubGlobal('webkitAudioContext', vi.fn(function () { return context; }));
    expect(await sound.unlockAudio()).toEqual({ ok: true });
    expect(context.resume).toHaveBeenCalledTimes(1);
  });
});

describe('break ticks', () => {
  it('plays immediately, alternates each second, avoids duplicate loops, and stops without closing audio', async () => {
    const context = createTestAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(function () { return context; }));
    expect(await sound.startBreakTickSound(soundSettings)).toEqual({ ok: true });
    await sound.startBreakTickSound(soundSettings);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(context.createOscillator.mock.results[0].value.frequency.setValueAtTime).toHaveBeenCalledWith(660, 10);
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator.mock.results[1].value.frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator.mock.results[2].value.frequency.setValueAtTime).toHaveBeenCalledWith(660, 10);
    sound.stopBreakTickSound();
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
    expect(context.close).not.toHaveBeenCalled();
  });
});
