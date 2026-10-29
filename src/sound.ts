import {
  BREAK_TICK_SOUND_PRESETS,
  DEFAULT_SOUND_SETTINGS,
  REMINDER_SOUND_PRESETS,
  clampVolume,
  type BreakTickSoundId,
  type ReminderSoundId,
  type SoundSettings,
  type ToneStep,
} from './soundPresets';

export type SoundResult = { ok: true } | { ok: false; reason: string };

let breakTickIntervalId: number | null = null;
let breakTickAudioContext: AudioContext | null = null;
let breakTickIndex = 0;
let sharedAudioContext: AudioContext | null = null;
let sharedAudioContextConstructor: typeof AudioContext | null = null;

function findReminderSoundPreset(id: ReminderSoundId) {
  return REMINDER_SOUND_PRESETS.find((preset) => preset.id === id) ?? REMINDER_SOUND_PRESETS[0];
}

function findBreakTickSoundPreset(id: BreakTickSoundId) {
  return BREAK_TICK_SOUND_PRESETS.find((preset) => preset.id === id) ?? BREAK_TICK_SOUND_PRESETS[0];
}

async function resumeSharedAudioContext(): Promise<AudioContext | null> {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (
    !sharedAudioContext
    || sharedAudioContext.state === 'closed'
    || sharedAudioContextConstructor !== AudioContextConstructor
  ) {
    if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
      void sharedAudioContext.close();
    }
    sharedAudioContext = new AudioContextConstructor();
    sharedAudioContextConstructor = AudioContextConstructor;
  }
  if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
  return sharedAudioContext;
}

function playTone(context: AudioContext, step: ToneStep, volume: number): void {
  const peakGain = clampVolume((step.gain ?? 0.28) * volume, 0.28);
  if (peakGain <= 0) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startAtSeconds = context.currentTime + step.delaySeconds;
  oscillator.type = step.waveform ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, startAtSeconds);
  gainNode.gain.setValueAtTime(0.0001, startAtSeconds);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), startAtSeconds + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAtSeconds + step.durationSeconds);
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startAtSeconds);
  oscillator.stop(startAtSeconds + step.durationSeconds);
}

function playToneSequence(context: AudioContext, steps: ToneStep[], volume: number): void {
  steps.forEach((step) => playTone(context, step, volume));
}

export async function playReminderSound(
  settings: SoundSettings = DEFAULT_SOUND_SETTINGS,
): Promise<SoundResult> {
  try {
    const preset = findReminderSoundPreset(settings.reminderSoundId);
    if (preset.steps.length === 0 || settings.reminderVolume <= 0) return { ok: true };

    const context = await resumeSharedAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    playToneSequence(context, preset.steps, settings.reminderVolume);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export async function unlockAudio(): Promise<SoundResult> {
  try {
    const context = await resumeSharedAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export async function startBreakTickSound(
  settings: SoundSettings = DEFAULT_SOUND_SETTINGS,
): Promise<SoundResult> {
  try {
    if (breakTickIntervalId !== null) return { ok: true };
    const preset = findBreakTickSoundPreset(settings.breakTickSoundId);
    if (preset.steps.length === 0 || settings.breakTickVolume <= 0) return { ok: true };

    const context = await resumeSharedAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    breakTickAudioContext = context;
    breakTickIndex = 0;
    const playTick = () => {
      if (!breakTickAudioContext) return;
      const step = preset.steps[breakTickIndex % preset.steps.length];
      playTone(breakTickAudioContext, { ...step, delaySeconds: 0 }, settings.breakTickVolume);
      breakTickIndex += 1;
    };
    playTick();
    breakTickIntervalId = window.setInterval(playTick, preset.intervalMs);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Tick-tock sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export function stopBreakTickSound(): void {
  if (breakTickIntervalId !== null) {
    window.clearInterval(breakTickIntervalId);
    breakTickIntervalId = null;
  }
  if (breakTickAudioContext) {
    breakTickAudioContext = null;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
