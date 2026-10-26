/**
 * Kiosk feedback tones and text-to-speech (same sounds as the original Vercel kiosk).
 * Failures are silent: sound must never block the flow.
 */
import { SPEECH_LANG, type Lang } from '../i18n';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.06) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(gain, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

export const b = {
  playTap() {
    tone(540, 0, 0.07, 'triangle', 0.04);
  },
  playBeep() {
    tone(880, 0, 0.18, 'sine', 0.08);
  },
  playSuccess() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine', 0.06));
  },
  playWarn() {
    tone(440, 0, 0.15, 'triangle', 0.06);
    tone(392, 0.18, 0.2, 'triangle', 0.06);
  },
  playError() {
    tone(220, 0, 0.25, 'sawtooth', 0.04);
  },
  playPrintWhir() {
    for (let i = 0; i < 10; i++) tone(140 + (i % 2) * 30, i * 0.12, 0.1, 'sawtooth', 0.02);
  },
  speak(text: string, lang: Lang) {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH_LANG[lang];
      u.rate = 0.95;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(SPEECH_LANG[lang].slice(0, 2)));
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch {
      /* no speech on this device */
    }
  },
  stopSpeaking() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  },
};
