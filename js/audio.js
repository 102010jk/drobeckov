'use strict';
/* ============ generative music & sfx (from Kočičí sklizeň) ============ */
const Sound = (() => {
  let ac = null, master, sfx, mus, nbuf;
  let on = store.get('dk_sound', true);
  let musOn = false, nextT = 0, step = 0, prog = 2;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [
    { bpm: 84, ch: [[53, 0], [50, 1], [46, 0], [48, 0]], mel: 77, pent: [0, 2, 4, 7, 9] },
    { bpm: 76, ch: [[57, 1], [53, 0], [48, 0], [55, 0]], mel: 81, pent: [0, 3, 5, 7, 10] },
    { bpm: 90, ch: [[48, 0], [55, 0], [57, 1], [53, 0]], mel: 84, pent: [0, 2, 4, 7, 9] },
    { bpm: 96, ch: [[55, 0], [50, 0], [52, 1], [48, 0]], mel: 79, pent: [0, 2, 4, 7, 9] }
  ];
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = on ? 0.8 : 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.55 * SET.sfx / 0.8; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = 0; mus.connect(master);
    const len = Math.floor(ac.sampleRate * 1.2);
    nbuf = ac.createBuffer(1, len, ac.sampleRate);
    const ch = nbuf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    nextT = ac.currentTime + 0.1;
    setInterval(tick, 40);
  }
  function tone(f, dur, o) {
    o = o || {};
    if (!ac) return;
    const t0 = o.at != null ? o.at : ac.currentTime + (o.delay || 0);
    const osc = ac.createOscillator(); osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(f, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    const g = ac.createGain(); const v = o.vol == null ? 0.15 : o.vol; const att = o.att || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g); g.connect(o.dest || sfx);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(dur, o) {
    o = o || {};
    if (!ac) return;
    const t0 = o.at != null ? o.at : ac.currentTime + (o.delay || 0);
    const src = ac.createBufferSource(); src.buffer = nbuf;
    const fl = ac.createBiquadFilter(); fl.type = o.ft || 'bandpass'; fl.frequency.value = o.freq || 1500; fl.Q.value = o.q || 0.8;
    const g = ac.createGain(); const v = o.vol || 0.1;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(o.dest || sfx);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
  }
  function schedule(s, t, P) {
    const [root, minor] = P.ch[Math.floor(s / 8) % 4];
    const st = s % 8, third = minor ? 3 : 4;
    if (st === 0) tone(mf(root), 1.1, { at: t, type: 'triangle', vol: 0.11, dest: mus, att: 0.01, lp: 900 });
    if (st === 4) tone(mf(root + 7), 0.7, { at: t, type: 'triangle', vol: 0.08, dest: mus, att: 0.01, lp: 900 });
    const tones = [root + 12, root + 12 + third, root + 19, root + 24];
    const pat = [0, 1, 2, 3, 2, 1, 2, 1];
    if (Math.random() > 0.15) tone(mf(tones[pat[st]]), 0.5, { at: t, type: 'triangle', vol: 0.035, dest: mus, lp: 2200 });
    if (st % 2 === 0 && Math.random() < 0.26) {
      const n = P.mel + P.pent[Math.floor(Math.random() * 5)] + (Math.random() < 0.2 ? 12 : 0) - 12;
      tone(mf(n), 1.2, { at: t, type: 'sine', vol: 0.05, dest: mus });
      tone(mf(n + 12), 0.6, { at: t, type: 'sine', vol: 0.012, dest: mus });
    }
    if (st % 2 === 1) noise(0.03, { at: t, ft: 'highpass', freq: 7500, q: 0.5, vol: 0.01, dest: mus });
    // era motifs: the valley's music grows with the town
    const era = typeof eraOf === 'function' ? eraOf() : 0;
    if (era >= 1 && st === 6 && s % 16 === 6) tone(mf(root + 24 + third), 0.9, { at: t, type: 'sine', vol: 0.03, dest: mus });           // workshop bell
    if (era >= 2 && st % 4 === 2 && !night) tone(mf(root - 12), 0.18, { at: t, type: 'square', vol: 0.018, dest: mus, lp: 500 });  // mining pluck
    if (era >= 3 && st === 3) noise(0.06, { at: t, ft: 'bandpass', freq: 1800, q: 4, vol: 0.012, dest: mus });                     // soft machine tick
    if (era >= 5 && Math.random() < 0.12) tone(mf(root + 36 + [0, 7, 12][Math.floor(Math.random() * 3)]), 0.4, { at: t, type: 'sine', vol: 0.014, dest: mus }); // starry sparkle
  }
  function tick() {
    if (!ac) return;
    if (!musOn || !on || ac.state !== 'running') { nextT = ac.currentTime + 0.05; return; }
    const P = PROG[prog], spb = 60 / P.bpm / 2 * (night ? 1.25 : 1);
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.2) { schedule(step, nextT, P); nextT += spb; step++; }
  }
  let night = false;
  const seq = (notes, gap, o) => notes.forEach((n, i) => tone(mf(n), o.dur || 0.2, Object.assign({}, o, { delay: i * gap })));
  return {
    init,
    get on() { return on; },
    toggle() { on = !on; store.set('dk_sound', on); if (master) master.gain.setTargetAtTime(on ? 0.8 : 0, ac.currentTime, 0.05); return on; },
    music(level) { musOn = level > 0; if (ac) mus.gain.setTargetAtTime(level * 0.85 * SET.music / 0.8, ac.currentTime, 0.6); },
    applyVol() { if (!ac) return; sfx.gain.setTargetAtTime(0.55 * SET.sfx / 0.8, ac.currentTime, 0.05); if (musOn) mus.gain.setTargetAtTime((night ? 0.45 : 1) * 0.85 * SET.music / 0.8, ac.currentTime, 0.2); },
    setSeason(i) { prog = SEASONS[i].music; },
    setNight(n) { night = n; if (ac && musOn) mus.gain.setTargetAtTime((n ? 0.45 : 1) * 0.85 * SET.music / 0.8, ac.currentTime, 1.5); },
    click() { tone(1100, 0.05, { type: 'square', vol: 0.025, lp: 4000 }); },
    place() { tone(180, 0.12, { type: 'triangle', slide: 120, vol: 0.14 }); noise(0.08, { freq: 900, vol: 0.06 }); },
    nope() { tone(220, 0.14, { type: 'square', slide: 160, vol: 0.04, lp: 1200 }); },
    built() { seq([67, 72, 76, 79], 0.07, { dur: 0.22, type: 'triangle', vol: 0.09 }); },
    coin() { tone(mf(88), 0.08, { type: 'square', vol: 0.03, lp: 3500 }); tone(mf(93), 0.18, { type: 'triangle', vol: 0.07, delay: 0.05 }); },
    deliver() { seq([72, 76, 79, 84, 88], 0.06, { dur: 0.24, type: 'triangle', vol: 0.09 }); },
    heart() { tone(mf(76), 0.18, { type: 'triangle', vol: 0.1 }); tone(mf(83), 0.3, { type: 'triangle', vol: 0.1, delay: 0.1 }); },
    season() { seq([72, 76, 79, 84, 79, 84, 88], 0.09, { dur: 0.25, type: 'triangle', vol: 0.08 }); },
    unlock() { seq([79, 83, 86, 91, 95], 0.055, { dur: 0.25, type: 'sine', vol: 0.1 }); },
    purr() {
      if (!ac) return;
      const t0 = ac.currentTime, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 48; lfo.frequency.value = 24; lg.gain.value = 0.5;
      f.type = 'lowpass'; f.frequency.value = 380;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.15); g.gain.setValueAtTime(0.14, t0 + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
      const amp = ac.createGain(); amp.gain.value = 0.5; lfo.connect(lg); lg.connect(amp.gain);
      o.connect(f); f.connect(amp); amp.connect(g); g.connect(sfx);
      o.start(t0); lfo.start(t0); o.stop(t0 + 1.15); lfo.stop(t0 + 1.15);
    },
    meow() {
      if (!ac) return;
      const t0 = ac.currentTime, k = rand(0.9, 1.15);
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420 * k, t0);
      o.frequency.linearRampToValueAtTime(700 * k, t0 + 0.12);
      o.frequency.linearRampToValueAtTime(520 * k, t0 + 0.3);
      o.frequency.linearRampToValueAtTime(380 * k, t0 + 0.45);
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
      f.frequency.setValueAtTime(800, t0); f.frequency.linearRampToValueAtTime(1900, t0 + 0.13); f.frequency.linearRampToValueAtTime(1100, t0 + 0.45);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.04);
      g.gain.setValueAtTime(0.3, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(f); f.connect(g); g.connect(sfx); o.start(t0); o.stop(t0 + 0.55);
    },
    chop() { noise(0.07, { freq: 1200, q: 2, vol: 0.08 }); tone(140, 0.08, { type: 'triangle', vol: 0.06 }); },
    /* nature ambience: called ~4× a second with the current scene */
    ambient(kind, amount) {
      if (!ac || !on || ac.state !== 'running' || SET.nature === false) return;
      const a = amount == null ? 1 : amount;
      if (kind === 'birds' && Math.random() < 0.18 * a) { const f = 2200 + Math.random() * 1800; for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) tone(f * (1 + Math.random() * 0.15), 0.07, { type: 'sine', vol: 0.012, slide: f * (1.3 + Math.random() * 0.4), delay: i * 0.09 }); }
      else if (kind === 'crickets' && Math.random() < 0.5 * a) { const f = 4200 + Math.random() * 400; for (let i = 0; i < 3; i++) tone(f, 0.025, { type: 'square', vol: 0.004, lp: 6000, delay: i * 0.05 }); }
      else if (kind === 'rain') noise(0.35, { ft: 'lowpass', freq: 1400 + Math.random() * 600, q: 0.3, vol: 0.022 * a });
      else if (kind === 'wind' && Math.random() < 0.3 * a) noise(1.2, { ft: 'bandpass', freq: 300 + Math.random() * 300, q: 0.7, vol: 0.02 });
      else if (kind === 'waves' && Math.random() < 0.15 * a) noise(1.6, { ft: 'lowpass', freq: 700, q: 0.4, vol: 0.02 });
    }
  };
})();
