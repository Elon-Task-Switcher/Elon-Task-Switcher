export type SoundResult = { ok: true } | { ok: false; reason: string };

const REMINDER_FREQUENCY_HZ = 880;
const REMINDER_DURATION_SECONDS = 1.2;
const REMINDER_PEAK_GAIN = 0.28;
const REMINDER_FADE_IN_SECONDS = 0.03;
const REMINDER_FADE_OUT_START_SECONDS = 0.95;

let tickTockInterval: number | null = null;
let tickTockContext: AudioContext | null = null;
let tickTockStep = 0;

async function getAudioContext(): Promise<AudioContext | null> {
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  const context = new AudioContextCtor();
  if (context.state === 'suspended') await context.resume();
  return context;
}

function playTone(context: AudioContext, frequency: number, peakGain: number, durationSeconds: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationSeconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + durationSeconds);
}

export async function playReminderSound(): Promise<SoundResult> {
  try {
    const context = await getAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    playTone(context, REMINDER_FREQUENCY_HZ, REMINDER_PEAK_GAIN, REMINDER_DURATION_SECONDS);
    window.setTimeout(() => void context.close(), (REMINDER_DURATION_SECONDS + 0.1) * 1000);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

export async function startTickTock(): Promise<SoundResult> {
  try {
    if (tickTockInterval !== null) return { ok: true };
    const context = await getAudioContext();
    if (!context) return { ok: false, reason: 'Audio is not supported in this browser.' };

    tickTockContext = context;
    tickTockStep = 0;
    const playTick = () => {
      if (!tickTockContext) return;
      const isTick = tickTockStep % 2 === 0;
      playTone(tickTockContext, isTick ? 660 : 440, 0.08, 0.08);
      tickTockStep += 1;
    };
    playTick();
    tickTockInterval = window.setInterval(playTick, 1000);
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
