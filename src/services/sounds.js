// Simple sound effects using Web Audio API oscillators - no external files needed
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function ensureCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration = 0.15, type = 'sine', vol = 0.3) {
  if (!audioCtx) return;
  ensureCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playCorrect() {
  playTone(523, 0.1, 'sine', 0.25);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 100);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200);
}

export function playWrong() {
  playTone(200, 0.2, 'sawtooth', 0.15);
  setTimeout(() => playTone(160, 0.3, 'sawtooth', 0.15), 150);
}

export function playPop() {
  playTone(800, 0.08, 'sine', 0.2);
  setTimeout(() => playTone(1200, 0.05, 'sine', 0.15), 50);
}

export function playWin() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.15, 'sine', 0.2), i * 80);
  });
}

export function playClick() {
  playTone(600, 0.05, 'sine', 0.15);
}

export function playFlip() {
  playTone(400, 0.06, 'triangle', 0.15);
  setTimeout(() => playTone(500, 0.06, 'triangle', 0.15), 40);
}

export function playBubble() {
  const freq = 600 + Math.random() * 600;
  playTone(freq, 0.1, 'sine', 0.2);
}

export function playCrash() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(100 + Math.random() * 300, 0.15, 'sawtooth', 0.1), i * 30);
  }
}

export function playStar() {
  playTone(880, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(1100, 0.12, 'sine', 0.2), 80);
}

export function playColorFill() {
  playTone(440 + Math.random() * 400, 0.08, 'triangle', 0.15);
}
