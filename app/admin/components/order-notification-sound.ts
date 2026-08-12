let audioContext: AudioContext | undefined;

function getAudioContext() {
  if (typeof window === "undefined") return undefined;
  const AudioContextConstructor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return undefined;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

export async function armOrderNotificationSound() {
  const context = getAudioContext();
  if (!context) return false;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }
  return context.state === "running";
}

export function playOrderNotificationSound() {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;

  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  gain.connect(context.destination);

  const firstTone = context.createOscillator();
  firstTone.type = "sine";
  firstTone.frequency.setValueAtTime(659.25, now);
  firstTone.connect(gain);
  firstTone.start(now);
  firstTone.stop(now + 0.24);

  const secondTone = context.createOscillator();
  secondTone.type = "sine";
  secondTone.frequency.setValueAtTime(880, now + 0.18);
  secondTone.connect(gain);
  secondTone.start(now + 0.18);
  secondTone.stop(now + 0.55);
}
