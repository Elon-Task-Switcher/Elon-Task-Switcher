export type ReminderSoundId =
  | 'classic-beep'
  | 'double-beep'
  | 'bell'
  | 'chime'
  | 'success'
  | 'alarm'
  | 'soft-ping'
  | 'silent';
export type BreakTickSoundId =
  | 'classic-tick'
  | 'soft-tick'
  | 'clock'
  | 'digital'
  | 'metronome'
  | 'silent';

export type SoundSettings = {
  reminderSoundId: ReminderSoundId;
  breakTickSoundId: BreakTickSoundId;
  reminderVolume: number;
  breakTickVolume: number;
};

export type ToneStep = {
  delaySeconds: number;
  frequency: number;
  durationSeconds: number;
  gain?: number;
  waveform?: OscillatorType;
};

type ReminderSoundPreset = {
  id: ReminderSoundId;
  label: string;
  description: string;
  steps: ToneStep[];
};

type BreakTickSoundPreset = {
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

export const REMINDER_SOUND_PRESETS: ReminderSoundPreset[] = [
  {
    id: 'classic-beep',
    label: 'Classic beep',
    description: 'Single strong beep.',
    steps: [
      { delaySeconds: 0, frequency: 880, durationSeconds: 1.2, gain: 0.32 },
    ],
  },
  {
    id: 'double-beep',
    label: 'Double beep',
    description: 'Two quick switch alerts.',
    steps: [
      { delaySeconds: 0, frequency: 880, durationSeconds: 0.28 },
      { delaySeconds: 0.38, frequency: 1040, durationSeconds: 0.35 },
    ],
  },
  {
    id: 'bell',
    label: 'Bell',
    description: 'Long clear bell-like reminder.',
    steps: [
      { delaySeconds: 0, frequency: 784, durationSeconds: 0.7, waveform: 'triangle' },
      { delaySeconds: 0.18, frequency: 1175, durationSeconds: 1.1, gain: 0.18, waveform: 'sine' },
    ],
  },
  {
    id: 'chime',
    label: 'Chime',
    description: 'Three-note calm chime.',
    steps: [
      { delaySeconds: 0, frequency: 659, durationSeconds: 0.28 },
      { delaySeconds: 0.24, frequency: 784, durationSeconds: 0.28 },
      { delaySeconds: 0.48, frequency: 988, durationSeconds: 0.6 },
    ],
  },
  {
    id: 'success',
    label: 'Success',
    description: 'Upward positive cue.',
    steps: [
      { delaySeconds: 0, frequency: 523, durationSeconds: 0.2 },
      { delaySeconds: 0.2, frequency: 659, durationSeconds: 0.2 },
      { delaySeconds: 0.4, frequency: 784, durationSeconds: 0.45 },
    ],
  },
  {
    id: 'alarm',
    label: 'Alarm',
    description: 'Louder alternating alarm.',
    steps: [
      { delaySeconds: 0, frequency: 740, durationSeconds: 0.2, waveform: 'square' },
      { delaySeconds: 0.28, frequency: 988, durationSeconds: 0.2, waveform: 'square' },
      { delaySeconds: 0.56, frequency: 740, durationSeconds: 0.2, waveform: 'square' },
      { delaySeconds: 0.84, frequency: 988, durationSeconds: 0.3, waveform: 'square' },
    ],
  },
  {
    id: 'soft-ping',
    label: 'Soft ping',
    description: 'Short low-distraction ping.',
    steps: [
      { delaySeconds: 0, frequency: 698, durationSeconds: 0.45, gain: 0.18, waveform: 'sine' },
    ],
  },
  {
    id: 'silent',
    label: 'Silent',
    description: 'No end sound.',
    steps: [],
  },
];

export const BREAK_TICK_SOUND_PRESETS: BreakTickSoundPreset[] = [
  {
    id: 'classic-tick',
    label: 'Classic tick-tock',
    description: 'Alternating tick and tock each second.',
    intervalMs: 1000,
    steps: [
      { delaySeconds: 0, frequency: 660, durationSeconds: 0.08 },
      { delaySeconds: 1, frequency: 440, durationSeconds: 0.08 },
    ],
  },
  {
    id: 'soft-tick',
    label: 'Soft tick',
    description: 'Light quiet tick each second.',
    intervalMs: 1000,
    steps: [
      { delaySeconds: 0, frequency: 520, durationSeconds: 0.05, gain: 0.14 },
    ],
  },
  {
    id: 'clock',
    label: 'Clock',
    description: 'Wood clock style tick-tock.',
    intervalMs: 1000,
    steps: [
      { delaySeconds: 0, frequency: 1200, durationSeconds: 0.035, waveform: 'square' },
      { delaySeconds: 1, frequency: 800, durationSeconds: 0.04, waveform: 'square' },
    ],
  },
  {
    id: 'digital',
    label: 'Digital blip',
    description: 'Short electronic pause cue.',
    intervalMs: 1000,
    steps: [
      { delaySeconds: 0, frequency: 980, durationSeconds: 0.045, waveform: 'sawtooth' },
    ],
  },
  {
    id: 'metronome',
    label: 'Metronome',
    description: 'Fast focus metronome.',
    intervalMs: 500,
    steps: [
      { delaySeconds: 0, frequency: 880, durationSeconds: 0.035, gain: 0.12 },
    ],
  },
  {
    id: 'silent',
    label: 'Silent break',
    description: 'No pause tick-tock.',
    intervalMs: 1000,
    steps: [],
  },
];

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
