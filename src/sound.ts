export type SoundResult = { ok: true } | { ok: false; reason: string };

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
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
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
