/**
 * TTS Service — Web Speech API with guaranteed async voice loading
 *
 * Chrome/Edge/Windows: Microsoft Jenny Neural or Google US English Female
 * Safari/iOS: Samantha or Siri (natural female)
 * Firefox: Best available OS English female voice
 *
 * Key fix: Chrome loads voices asynchronously. We wait for them before speaking.
 */

const PREFERRED_VOICES = [
  'Microsoft Jenny Online (Natural)',  // Edge/Chrome on Windows 11
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny',
  'Google US English',                 // Chrome on all platforms
  'Samantha',                          // Safari macOS
  'Karen',                             // Safari Australian
  'Moira',
  'Fiona',
  'Microsoft Zira',
];

let bestVoice = null;

// Promise that resolves once voices are loaded (handles Chrome's async loading)
let voicesLoaded = false;
let voicesResolve;
const voicesReady = new Promise(r => { voicesResolve = r; });

function findBestVoice(voices) {
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(v => v.name.startsWith(name) && v.lang.startsWith('en'));
    if (v) return v;
  }
  // Any English female-sounding voice
  const onlineEn = voices.find(v => v.lang.startsWith('en') && v.online !== false);
  if (onlineEn) return onlineEn;
  return voices.find(v => v.lang.startsWith('en')) ?? null;
}

function tryLoadVoices() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (voices.length > 0) {
    bestVoice = findBestVoice(voices);
    if (!voicesLoaded) { voicesLoaded = true; voicesResolve(); }
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    bestVoice = null;
    tryLoadVoices();
  });
  tryLoadVoices(); // already loaded in Firefox/Safari
}

export async function ttsSpeak(text, options = {}) {
  if (!text || !window.speechSynthesis) return;

  // Wait up to 2 seconds for voices to be ready (Chrome needs this)
  await Promise.race([voicesReady, new Promise(r => setTimeout(r, 2000))]);
  // Retry voice lookup in case it populated during the wait
  if (!bestVoice) tryLoadVoices();

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  if (bestVoice) utter.voice = bestVoice;
  utter.lang = 'en-US';
  utter.rate = options.rate ?? 0.82;
  utter.pitch = options.pitch ?? 1.05;
  utter.volume = 1;
  if (options.onEnd) utter.onend = options.onEnd;

  window.speechSynthesis.speak(utter);
}

export function ttsStop() {
  window.speechSynthesis?.cancel();
}



