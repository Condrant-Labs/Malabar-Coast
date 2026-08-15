let audioContext: AudioContext | undefined;
let notificationSound: AudioBuffer | undefined;
let notificationSoundRequest: Promise<AudioBuffer | undefined> | undefined;

const notificationSoundUrl = "/sounds/mixkit-futuristic-doorbell-928.wav";

function getAudioContext() {
  if (typeof window === "undefined") return undefined;
  const AudioContextConstructor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return undefined;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function loadNotificationSound(context: AudioContext) {
  if (notificationSound) return Promise.resolve(notificationSound);
  notificationSoundRequest ??= fetch(notificationSoundUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Notification sound request failed (${response.status}).`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((sound) => {
      notificationSound = sound;
      return sound;
    })
    .catch((error) => {
      notificationSoundRequest = undefined;
      console.error("Could not load the order notification sound.", error);
      return undefined;
    });
  return notificationSoundRequest;
}

function playLoadedSound(context: AudioContext, sound: AudioBuffer) {
  const source = context.createBufferSource();
  const gain = context.createGain();
  gain.gain.value = 0.7;
  source.buffer = sound;
  source.connect(gain);
  gain.connect(context.destination);
  source.start();
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
  if (context.state !== "running") return false;
  return Boolean(await loadNotificationSound(context));
}

export function playOrderNotificationSound() {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  if (notificationSound) {
    playLoadedSound(context, notificationSound);
    return;
  }
  void loadNotificationSound(context).then((sound) => {
    if (sound && context.state === "running") playLoadedSound(context, sound);
  });
}
