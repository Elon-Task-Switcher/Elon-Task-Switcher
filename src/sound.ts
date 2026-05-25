export type SoundResult = { ok: true } | { ok: false; reason: string };
export type ReminderSoundId = 'classic-beep' | 'double-beep' | 'bell' | 'chime' | 'success' | 'alarm' | 'soft-ping' | 'silent';
export type BreakTickSoundId = 'classic-tick' | 'soft-tick' | 'clock' | 'digital' | 'metronome' | 'silent';

export type SoundSettings = {
  reminderSoundId: ReminderSoundId;
  breakTickSoundId: BreakTickSoundId;
  reminderVolume: number;
  breakTickVolume: number;
};

type ToneStep = {
  at: number;
  frequency: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
};

type ReminderPreset = {
  id: ReminderSoundId;
  label: string;
  description: string;
  steps: ToneStep[];
};

type TickPreset = {
  id: BreakTickSoundId;
  label: string;
  description: string;
  intervalMs: number;
  steps: ToneStep[];
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  reminderSoundId: 'bell',
  breakTickSoundId: 'classic-tick',
  reminderVolume: 0.85,
  breakTickVolume: 0.45,
};

export const REMINDER_SOUND_PRESETS: ReminderPreset[] = [
  { id: 'classic-beep', label: 'Classic beep', description: 'Single strong beep.', steps: [{ at: 0, frequency: 880, duration: 1.2, gain: 0.32 }] },
  { id: 'double-beep', label: 'Double beep', description: 'Two quick switch alerts.', steps: [{ at: 0, frequency: 880, duration: 0.28 }, { at: 0.38, frequency: 1040, duration: 0.35 }] },
  { id: 'bell', label: 'Bell', description: 'Long clear bell-like reminder.', steps: [{ at: 0, frequency: 784, duration: 0.7, type: 'triangle' }, { at: 0.18, frequency: 1175, duration: 1.1, gain: 0.18, type: 'sine' }] },
  { id: 'chime', label: 'Chime', description: 'Three-note calm chime.', steps: [{ at: 0, frequency: 659, duration: 0.28 }, { at: 0.24, frequency: 784, duration: 0.28 }, { at: 0.48, frequency: 988, duration: 0.6 }] },
  { id: 'success', label: 'Success', description: 'Upward positive cue.', steps: [{ at: 0, frequency: 523, duration: 0.2 }, { at: 0.2, frequency: 659, duration: 0.2 }, { at: 0.4, frequency: 784, duration: 0.45 }] },
  { id: 'alarm', label: 'Alarm', description: 'Louder alternating alarm.', steps: [{ at: 0, frequency: 740, duration: 0.2, type: 'square' }, { at: 0.28, frequency: 988, duration: 0.2, type: 'square' }, { at: 0.56, frequency: 740, duration: 0.2, type: 'square' }, { at: 0.84, frequency: 988, duration: 0.3, type: 'square' }] },
  { id: 'soft-ping', label: 'Soft ping', description: 'Short low-distraction ping.', steps: [{ at: 0, frequency: 698, duration: 0.45, gain: 0.18, type: 'sine' }] },
  { id: 'silent', label: 'Silent', description: 'No end sound.', steps: [] },
];

export const BREAK_TICK_SOUND_PRESETS: TickPreset[] = [
  { id: 'classic-tick', label: 'Classic tick-tock', description: 'Alternating tick and tock each second.', intervalMs: 1000, steps: [{ at: 0, frequency: 660, duration: 0.08 }, { at: 1, frequency: 440, duration: 0.08 }] },
  { id: 'soft-tick', label: 'Soft tick', description: 'Light quiet tick each second.', intervalMs: 1000, steps: [{ at: 0, frequency: 520, duration: 0.05, gain: 0.14 }] },
  { id: 'clock', label: 'Clock', description: 'Wood clock style tick-tock.', intervalMs: 1000, steps: [{ at: 0, frequency: 1200, duration: 0.035, type: 'square' }, { at: 1, frequency: 800, duration: 0.04, type: 'square' }] },
  { id: 'digital', label: 'Digital blip', description: 'Short electronic pause cue.', intervalMs: 1000, steps: [{ at: 0, frequency: 980, duration: 0.045, type: 'sawtooth' }] },
  { id: 'metronome', label: 'Metronome', description: 'Fast focus metronome.', intervalMs: 500, steps: [{ at: 0, frequency: 880, duration: 0.035, gain: 0.12 }] },
  { id: 'silent', label: 'Silent break', description: 'No pause tick-tock.', intervalMs: 1000, steps: [] },
];

let tickTockInterval: number | null = null;
let tickTockContext: AudioContext | null = null;
let tickTockStep = 0;

export function isReminderSoundId(value: unknown): value is ReminderSoundId {
  return REMINDER_SOUND_PRESETS.some((preset) => preset.id === value);
}

export function isBreakTickSoundId(value: unknown): value is BreakTickSoundId {
  return BREAK_TICK_SOUND_PRESETS.some((preset) => preset.id === value);
}

export function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function getReminderPreset(id: ReminderSoundId): ReminderPreset {
  return REMINDER_SOUND_PRESETS.find((preset) => preset.id === id) ?? REMINDER_SOUND_PRESETS[0];
}

function getTickPreset(id: BreakTickSoundId): TickPreset {
  return BREAK_TICK_SOUND_PRESETS.find((preset) => preset.id === id) ?? BREAK_TICK_SOUND_PRESETS[0];
}

async function getAudioContext(): Promise<AudioContext | null> {
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  const context = new AudioContextCtor();
  if (context.state === 'suspended') await context.resume();
  return context;
}

function playTone(context: AudioContext, step: ToneStep, volume: number): void {
  const peakGain = clampVolume((step.gain ?? 0.28) * volume, 0.28);
  if (peakGain <= 0) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + step.at;
  oscillator.type = step.type ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + step.duration);
}

function playSteps(context: AudioContext, steps: ToneStep[], volume: number): void {
  steps.forEach((step) => playTone(context, step, volume));
}

function presetLengthSeconds(steps: ToneStep[]): number {
  return steps.reduce((max, step) => Math.max(max, step.at + step.duration), 0);
}

export async function playReminderSound(settings: SoundSettings = DEFAULT_SOUND_SETTINGS): Promise<SoundResult> {
  try {
    const preset = getReminderPreset(settings.reminderSoundId);
    if (preset.steps.length === 0 || settings.reminderVolume <= 0) return { ok: true };

    const context = await getAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    playSteps(context, preset.steps, settings.reminderVolume);
    window.setTimeout(() => void context.close(), (presetLengthSeconds(preset.steps) + 0.2) * 1000);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export async function startTickTock(settings: SoundSettings = DEFAULT_SOUND_SETTINGS): Promise<SoundResult> {
  try {
    if (tickTockInterval !== null) return { ok: true };
    const preset = getTickPreset(settings.breakTickSoundId);
    if (preset.steps.length === 0 || settings.breakTickVolume <= 0) return { ok: true };

    const context = await getAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    tickTockContext = context;
    tickTockStep = 0;
    const playTick = () => {
      if (!tickTockContext) return;
      const step = preset.steps[tickTockStep % preset.steps.length];
      playTone(tickTockContext, { ...step, at: 0 }, settings.breakTickVolume);
      tickTockStep += 1;
    };
    playTick();
    tickTockInterval = window.setInterval(playTick, preset.intervalMs);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Tick-tock sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export function stopTickTock(): void {
  if (tickTockInterval !== null) {
    window.clearInterval(tickTockInterval);
    tickTockInterval = null;
  }
  if (tickTockContext) {
    void tickTockContext.close();
    tickTockContext = null;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
