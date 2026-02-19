// ============================================================
//  ringtones.js — 5 Web Audio Ringtones
//  No external files. All generated via Web Audio API.
//  Works offline, zero dependencies.
// ============================================================

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ── Utility ───────────────────────────────────────────────────
function osc(ctx, type, freq, start, dur, gainVal = 0.4) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(start);
  o.stop(start + dur);
}

function note(ctx, freq, start, dur) {
  osc(ctx, 'sine', freq, start, dur, 0.35);
}

// ── 1. Gentle — soft sine arpeggio ───────────────────────────
function playGentle() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((f, i) => note(ctx, f, t + i * 0.18, 0.35));
}

// ── 2. Classic — church bell chord ───────────────────────────
function playClassic() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  function bell(freq, start) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.3, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(start);
    o.stop(start + 1.2);
  }

  [523, 659, 784].forEach((f, i) => bell(f, t + i * 0.08));
}

// ── 3. Digital — retro beep sequence ─────────────────────────
function playDigital() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const pattern = [880, 0, 880, 0, 1320];
  let offset = 0;
  pattern.forEach((f) => {
    if (f > 0) osc(ctx, 'square', f, t + offset, 0.1, 0.2);
    offset += 0.12;
  });
}

// ── 4. Chime — pentatonic descend ────────────────────────────
function playChime() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const freqs = [1047, 880, 784, 659, 523];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t + i * 0.15);
    g.gain.setValueAtTime(0.28, t + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.6);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t + i * 0.15);
    o.stop(t + i * 0.15 + 0.6);
  });
}

// ── 5. Urgent — rapid double-pulse alarm ─────────────────────
function playUrgent() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const base = t + i * 0.28;
    osc(ctx, 'sawtooth', 660, base,         0.1, 0.25);
    osc(ctx, 'sawtooth', 880, base + 0.12,  0.1, 0.25);
  }
}

// ── Public API ────────────────────────────────────────────────
const RINGTONES = {
  gentle:  { label: 'Gentle',  icon: '🔔', play: playGentle  },
  classic: { label: 'Classic', icon: '🎵', play: playClassic },
  digital: { label: 'Digital', icon: '📱', play: playDigital },
  chime:   { label: 'Chime',   icon: '🎶', play: playChime   },
  urgent:  { label: 'Urgent',  icon: '⚡', play: playUrgent  },
};

function playRingtone(toneKey) {
  const tone = RINGTONES[toneKey];
  if (tone) tone.play();
}
