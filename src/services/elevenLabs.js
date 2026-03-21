/**
 * ElevenLabs TTS Service
 * Voice: hA4zGnmTwX2NQiTRMt7o
 */

const VOICE_ID = 'hA4zGnmTwX2NQiTRMt7o';
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// Simple LRU audio cache (keeps last 50 phrases)
const audioCache = new Map();
const MAX_CACHE = 50;

let currentAudio = null;

function getApiKey() {
  const key = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  if (!key || key === 'YOUR_ELEVENLABS_API_KEY_HERE') return '';
  return key;
}

function cacheSet(key, url) {
  if (audioCache.size >= MAX_CACHE) {
    const oldest = audioCache.keys().next().value;
    URL.revokeObjectURL(audioCache.get(oldest));
    audioCache.delete(oldest);
  }
  audioCache.set(key, url);
}

export function isElevenLabsConfigured() {
  const configured = !!getApiKey();
  console.log('[ElevenLabs] configured:', configured);
  return configured;
}

export async function elevenLabsSpeak(text, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey || !text) return false;

  elevenLabsStop();

  const cacheKey = text.trim().toLowerCase();

  if (audioCache.has(cacheKey)) {
    console.log('[ElevenLabs] cache hit:', text);
    return playAudioUrl(audioCache.get(cacheKey), options);
  }

  console.log('[ElevenLabs] fetching audio for:', text);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[ElevenLabs] API error', res.status, body);
      return false;
    }

    const blob = await res.blob();
    console.log('[ElevenLabs] got audio blob, size:', blob.size);
    const url = URL.createObjectURL(blob);
    cacheSet(cacheKey, url);
    return playAudioUrl(url, options);
  } catch (err) {
    console.warn('[ElevenLabs] Request failed:', err);
    return false;
  }
}

function playAudioUrl(url, options = {}) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.playbackRate = options.playbackRate || 0.92;
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      if (options.onEnd) options.onEnd();
      resolve(true);
    };

    audio.onerror = (e) => {
      console.warn('[ElevenLabs] Audio playback error:', e);
      currentAudio = null;
      resolve(false);
    };

    audio.play().catch((err) => {
      console.warn('[ElevenLabs] audio.play() rejected:', err);
      currentAudio = null;
      resolve(false);
    });
  });
}

export function elevenLabsStop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
