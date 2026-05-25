export type SoundResult = { ok: true } | { ok: false; reason: string };

const REMINDER_FREQUENCY_HZ = 880;
const REMINDER_DURATION_SECONDS = 1.2;
const REMINDER_PEAK_GAIN = 0.28;
const REMINDER_FADE_IN_SECONDS = 0.03;
const REMINDER_FADE_OUT_START_SECONDS = 0.95;

export async function playReminderSound(): Promise<SoundResult> {
  try {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      return { ok: false, reason: 'Audio is not supported in this browser.' };
    }

    const context = new AudioContextCtor();
    if (context.state === 'suspended') {
      await context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(REMINDER_FREQUENCY_HZ, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(REMINDER_PEAK_GAIN, context.currentTime + REMINDER_FADE_IN_SECONDS);
    gain.gain.setValueAtTime(REMINDER_PEAK_GAIN, context.currentTime + REMINDER_FADE_OUT_START_SECONDS);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + REMINDER_DURATION_SECONDS);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + REMINDER_DURATION_SECONDS);
    oscillator.addEventListener('ended', () => void context.close());
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Sound was blocked. Click Test Sound or interact with the page before starting a session.',
    };
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
