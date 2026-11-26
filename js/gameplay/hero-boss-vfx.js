/* Candy Magic Royale — 60 FPS 16-Frame Character Sprite Animator, Hero Ultimate Rings,
 * Boss HP Battle Bar & HTML5 Canvas VFX Engine (Crystal Beam, Magic Bolts, Golden Energy Orbs,
 * Red Danger Smoke, & Boss Purple-Red Lightning Bolts).
 */
(() => {
  "use strict";
  if (window.__CMR_HERO_BOSS_VFX__) return;
  window.__CMR_HERO_BOSS_VFX__ = true;

  const Engine = window.CMRHeroBossEngine;
  if (!Engine) return;

  const RING_RADIUS = 45;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~282.743

  // ---- Procedural Web Audio Synth SFX (Respects CMRAudio.isSfxEnabled()) ----
  let synthCtx = null;
  function getSynthCtx() {
    if (!window.CMRAudio?.isSfxEnabled?.()) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!synthCtx) synthCtx = new AC();
      if (synthCtx.state === "suspended") synthCtx.resume().catch(() => {});
      return synthCtx;
    } catch (_) {
      return null;
    }
  }

  function playBattleSfx(kind) {
    const ctx = getSynthCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(ctx.destination);

    try {
      if (kind === "evil_laugh") {
        // Mischievous descending 4-syllable boss chuckle
        [340, 290, 250, 210].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + i * 0.13);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + i * 0.13 + 0.1);
          g.gain.setValueAtTime(0.001, now + i * 0.13);
          g.gain.linearRampToValueAtTime(0.45, now + i * 0.13 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.13 + 0.11);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now + i * 0.13);
          osc.stop(now + i * 0.13 + 0.12);
        });
      } else if (kind === "electric_charge") {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.36);
        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.65, now + 0.28);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.42);
      } else if (kind === "thunder") {
        // Noise burst + deep sub impact
        const len = Math.floor(ctx.sampleRate * 0.48);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.16));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(140, now + 0.44);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.85, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        src.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        src.start(now);
      } else if (kind === "crystal_beam") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(420, now + 0.55);
        osc2.frequency.setValueAtTime(1320, now);
        osc2.frequency.exponentialRampToValueAtTime(640, now + 0.55);
        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.6, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else if (kind === "magic_bolt") {
        [520, 680, 920].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          osc.frequency.exponentialRampToValueAtTime(f * 1.45, now + i * 0.08 + 0.2);
          g.gain.setValueAtTime(0.01, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.5, now + i * 0.08 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.24);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.25);
        });
      } else if (kind === "boss_hit") {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(52, now + 0.16);
        g.gain.setValueAtTime(0.85, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (kind === "boss_defeat") {
        [330, 440, 554, 659, 880].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, now + i * 0.07);
          g.gain.setValueAtTime(0.01, now + i * 0.07);
          g.gain.linearRampToValueAtTime(0.55, now + i * 0.07 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.42);
        });
      }
    } catch (_) {}
  }

  // ---- Sprite Controller (16-Frame 4x4 Row-Major, Zero GIFs) ----
  function createSpriteActor(elId, opts = {}) {
    let sheetUrl = "";
    let frameIndex = 0;
    let busy = false;
    let timers = [];
    let loopTimer = 0;
    let isContinuousFlap = Boolean(opts.continuousFlap);

    function getEl() {
      return document.getElementById(elId);
    }

    function clearTimers() {
      for (const t of timers) clearTimeout(t);
      timers = [];
    }

    function stopLoops() {
      if (loopTimer) {
        clearInterval(loopTimer);
        loopTimer = 0;
      }
    }

    function setFrame(idx) {
      frameIndex = Math.max(0, Math.min(15, Math.floor(Number(idx) || 0)));
      const el = getEl();
      if (!el) return;
      const pos = Engine.getSpriteFramePosition(frameIndex);
      el.style.backgroundPosition = pos.cssPosition;
      el.dataset.frame = String(frameIndex);
    }

    function setSheet(url, optsUpdate = {}) {
      sheetUrl = url || "";
      if (typeof optsUpdate.continuousFlap === "boolean") {
        isContinuousFlap = optsUpdate.continuousFlap;
      }
      const el = getEl();
      if (el && sheetUrl) {
        el.style.backgroundImage = `url("${sheetUrl}")`;
        el.dataset.sheet = sheetUrl;
      }
      resetToIdle();
    }

    function playSequence(frames, stepMs, onDone) {
      clearTimers();
      if (!frames || !frames.length) {
        if (onDone) onDone();
        return;
      }
      frames.forEach((f, i) => {
        const t = setTimeout(() => {
          setFrame(f);
          if (i === frames.length - 1 && onDone) onDone();
        }, i * stepMs);
        timers.push(t);
      });
    }

    function resetToIdle() {
      clearTimers();
      busy = false;
      setFrame(0);
      const el = getEl();
      if (el) {
        el.classList.remove("is-happy-bounce", "is-celebrate-hop", "is-lunge", "is-boss-laugh", "is-boss-flinch", "is-boss-defeat");
      }
    }

    function startIdleLoop(kind) {
      stopLoops();
      if (kind === "dragon") {
        let wingStep = 0;
        loopTimer = setInterval(() => {
          if (busy || document.hidden) return;
          const seq = Engine.FRAME_SEQUENCES.DRAGON_WING_LOOP;
          setFrame(seq[wingStep++ % seq.length]);
        }, Engine.TIMINGS.DRAGON_FLAP_MS);
      } else if (kind === "hero") {
        loopTimer = setInterval(() => {
          if (busy || document.hidden) return;
          playSequence(Engine.FRAME_SEQUENCES.BLINK, Engine.TIMINGS.STEP_MS);
        }, Engine.TIMINGS.BLINK_INTERVAL_MS);
      } else if (kind === "boss") {
        loopTimer = setInterval(() => {
          if (busy || document.hidden) return;
          const bossStage = document.getElementById("bossArenaStage");
          if (!bossStage || bossStage.classList.contains("hidden")) return;
          playBossEvilLaugh();
        }, Engine.TIMINGS.BOSS_LAUGH_INTERVAL_MS);
      }
    }

    function playHappy() {
      if (busy) return;
      busy = true;
      const el = getEl();
      playSequence(Engine.FRAME_SEQUENCES.HERO_HAPPY_IN, Engine.TIMINGS.STEP_MS, () => {
        if (el) el.classList.add("is-happy-bounce");
        const holdT = setTimeout(() => {
          if (el) el.classList.remove("is-happy-bounce");
          playSequence(Engine.FRAME_SEQUENCES.HERO_HAPPY_OUT, Engine.TIMINGS.STEP_MS, () => {
            busy = false;
          });
        }, Engine.TIMINGS.HAPPY_HOLD_MS);
        timers.push(holdT);
      });
    }

    function playCelebrate(extraClass = "is-celebrate-hop") {
      clearTimers();
      busy = true;
      const el = getEl();
      if (el) el.classList.remove("is-happy-bounce", "is-celebrate-hop", "is-lunge");
      playSequence(Engine.FRAME_SEQUENCES.HERO_CELEBRATE_IN, Engine.TIMINGS.STEP_MS, () => {
        if (el && extraClass) el.classList.add(extraClass);
        const holdT = setTimeout(() => {
          if (el && extraClass) el.classList.remove(extraClass);
          playSequence(Engine.FRAME_SEQUENCES.HERO_CELEBRATE_OUT, Engine.TIMINGS.STEP_MS, () => {
            setFrame(0);
            busy = false;
          });
        }, Engine.TIMINGS.CELEBRATE_HOLD_MS);
        timers.push(holdT);
      });
    }

    function playBossEvilLaugh() {
      if (busy) return;
      busy = true;
      const el = getEl();
      if (el) el.classList.add("is-boss-laugh");
      playBattleSfx("evil_laugh");
      playSequence(Engine.FRAME_SEQUENCES.BOSS_EVIL_LAUGH, 95, () => {
        if (el) el.classList.remove("is-boss-laugh");
        setFrame(0);
        busy = false;
      });
    }

    function playBossFlinch() {
      const el = getEl();
      if (!el) return;
      el.classList.remove("is-boss-flinch");
      void el.offsetWidth;
      el.classList.add("is-boss-flinch");
      clearTimeout(el.__flinchT);
      el.__flinchT = setTimeout(() => el.classList.remove("is-boss-flinch"), 260);
    }

    function playBossPunishmentSequence(onStrikeImpact, onFinished) {
      clearTimers();
      busy = true;
      playBattleSfx("electric_charge");
      // Step 1: Angry Charge [4, 5, 6, 7]
      playSequence(Engine.FRAME_SEQUENCES.BOSS_ANGRY_CHARGE, Engine.TIMINGS.STEP_MS, () => {
        // Step 2: Lightning Strike [8, 9, 10, 11]
        playSequence(Engine.FRAME_SEQUENCES.BOSS_LIGHTNING_STRIKE, Engine.TIMINGS.STEP_MS, () => {
          playBattleSfx("thunder");
          if (typeof onStrikeImpact === "function") onStrikeImpact();
          // Hold frame 11 for 850ms while lightning hits board
          const holdT = setTimeout(() => {
            // Step 3: Smooth return [12, 13, 14, 15] -> 0
            playSequence(Engine.FRAME_SEQUENCES.BOSS_RETURN_IDLE, Engine.TIMINGS.STEP_MS, () => {
              setFrame(0);
              busy = false;
              if (typeof onFinished === "function") onFinished();
            });
          }, Engine.TIMINGS.BOSS_STRIKE_HOLD_MS);
          timers.push(holdT);
        });
      });
    }

    function playBossDefeatBurst() {
      clearTimers();
      busy = true;
      setFrame(11);
      const el = getEl();
      if (el) el.classList.add("is-boss-defeat");
      playBattleSfx("boss_defeat");
    }

    return {
      setSheet,
      setFrame,
      getFrame: () => frameIndex,
      startIdleLoop,
      stopLoops,
      resetToIdle,
      playHappy,
      playCelebrate,
      playBossEvilLaugh,
      playBossFlinch,
      playBossPunishmentSequence,
      playBossDefeatBurst,
    };
  }

  const leftActor = createSpriteActor("heroLeftSprite");
  const rightActor = createSpriteActor("heroRightSprite", { continuousFlap: true });
  const bossActor = createSpriteActor("bossCenterSprite");

  // ---- Shared 60 FPS HTML5 Canvas VFX Layer ----
  const particles = [];
  const beams = [];
  const bolts = [];
  const orbs = [];
  const lightnings = [];
  const smokeParticles = [];
  let vfxRaf = 0;
  let lastFrameAt = 0;
  let smokeActive = false;
  let smokeSpawnAccum = 0;

  function getCanvas() {
    const canvas = document.getElementById("battleVfxCanvas");
    const shell = document.getElementById("gameShell");
    if (!canvas || !shell) return null;
    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { canvas, ctx: canvas.getContext("2d"), w, h, dpr, shellRect: rect };
  }

  function toShellLocal(clientX, clientY) {
    const shell = document.getElementById("gameShell");
    if (!shell) return { x: clientX, y: clientY };
    const rect = shell.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function getElementCenterLocal(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return toShellLocal(r.left + r.width * 0.5, r.top + r.height * 0.5);
  }

  function getCellCenterLocal(r, c, rows = 8, cols = 7) {
    const board = document.getElementById("renderCanvas") || document.querySelector(".art-board-wrap");
    if (!board) return { x: 180, y: 420 };
    const rect = board.getBoundingClientRect();
    const cx = rect.left + ((c + 0.5) / cols) * rect.width;
    const cy = rect.top + ((r + 0.5) / rows) * rect.height;
    return toShellLocal(cx, cy);
  }

  function spawnSparkles(x, y, colors, count = 16, speedMul = 1) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = (55 + Math.random() * 145) * speedMul;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        size: 3 + Math.random() * 5,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 0.42 + Math.random() * 0.32,
        shape: i % 3 === 0 ? "shard" : "star",
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10,
      });
    }
    ensureVfxLoop();
  }

  function buildLightningPolyline(x0, y0, x1, y1, segments = 9) {
    const pts = [{ x: x0, y: y0 }];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = (Math.random() - 0.5) * 34 * Math.sin(t * Math.PI);
      pts.push({
        x: x0 + dx * t + nx * jitter,
        y: y0 + dy * t + ny * jitter,
      });
    }
    pts.push({ x: x1, y: y1 });
    return pts;
  }

  function ensureVfxLoop() {
    if (vfxRaf) return;
    lastFrameAt = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastFrameAt) / 1000));
      lastFrameAt = now;
      const info = getCanvas();
      if (!info || !info.ctx) {
        vfxRaf = 0;
        return;
      }
      const { ctx, w, h, dpr } = info;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 1) Slow-rising semi-transparent Red Danger Smoke behind Boss
      if (smokeActive) {
        smokeSpawnAccum += dt;
        if (smokeSpawnAccum >= 0.18 && smokeParticles.length < 18) {
          smokeSpawnAccum = 0;
          const bossEl = document.getElementById("bossCenterSprite");
          const center = getElementCenterLocal(bossEl);
          if (center) {
            smokeParticles.push({
              x: center.x + (Math.random() - 0.5) * 86,
              y: center.y + 22 + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 14,
              vy: -(18 + Math.random() * 20),
              r: 14 + Math.random() * 18,
              life: 0,
              maxLife: 1.9 + Math.random() * 1.1,
            });
          }
        }
      }

      for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const s = smokeParticles[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          smokeParticles.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const p = s.life / s.maxLife;
        const alpha = Math.sin(p * Math.PI) * 0.24;
        const rad = s.r * (0.8 + p * 0.8);
        const grad = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, rad);
        grad.addColorStop(0, `rgba(239, 68, 68, ${alpha.toFixed(3)})`);
        grad.addColorStop(0.55, `rgba(153, 27, 27, ${(alpha * 0.55).toFixed(3)})`);
        grad.addColorStop(1, "rgba(127, 29, 29, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) Crystal Dragon Cyan-Gold Energy Beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.life += dt;
        if (b.life >= b.maxLife) {
          beams.splice(i, 1);
          continue;
        }
        const p = b.life / b.maxLife;
        const grow = Math.min(1, p / 0.25);
        const fade = p > 0.62 ? Math.max(0, 1 - (p - 0.62) / 0.38) : 1;
        const tx = b.x0 + (b.x1 - b.x0) * grow;
        const ty = b.y0 + (b.y1 - b.y0) * grow;

        ctx.save();
        ctx.lineCap = "round";
        // Outer golden-cyan aura
        ctx.globalAlpha = 0.55 * fade;
        ctx.strokeStyle = "#facc15";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 24;
        ctx.lineWidth = 26 * fade;
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Mid crystal cyan energy
        ctx.globalAlpha = 0.9 * fade;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 14 * fade;
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Bright ice-white core
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#f0f9ff";
        ctx.lineWidth = 5 * fade;
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Glowing impact ring at beam head
        const headGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, 38 * fade);
        headGrad.addColorStop(0, "rgba(255,255,255,0.95)");
        headGrad.addColorStop(0.4, "rgba(56,189,248,0.85)");
        headGrad.addColorStop(0.75, "rgba(250,204,21,0.5)");
        headGrad.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 38 * fade, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3) Queen Luma Pink-Gold Magic Bolts & Pharaoh Boy Ankh Bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life += dt;
        if (b.life < 0) continue;
        const t = Math.min(1, b.life / b.duration);
        const inv = 1 - t;
        const x = inv * inv * b.x0 + 2 * inv * t * b.cx + t * t * b.x1;
        const y = inv * inv * b.y0 + 2 * inv * t * b.cy + t * t * b.y1;

        ctx.save();
        const grad = ctx.createRadialGradient(x, y, 2, x, y, 16);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.45, b.colorCore);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Trail tail
        const pt = Math.max(0, t - 0.14);
        const pi = 1 - pt;
        const px = pi * pi * b.x0 + 2 * pi * pt * b.cx + pt * pt * b.x1;
        const py = pi * pi * b.y0 + 2 * pi * pt * b.cy + pt * pt * b.y1;
        ctx.strokeStyle = b.colorGlow;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();

        if (t >= 1) {
          spawnSparkles(b.x1, b.y1, [b.colorCore, b.colorGlow, "#ffffff"], 12, 0.9);
          if (typeof b.onArrive === "function") b.onArrive();
          bolts.splice(i, 1);
        }
      }

      // 4) Golden Magic Energy Orbs arcing from Board -> Boss
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.life += dt;
        if (o.life < 0) continue;
        const t = Math.min(1, o.life / o.duration);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const inv = 1 - ease;
        const x = inv * inv * o.x0 + 2 * inv * ease * o.cx + ease * ease * o.x1;
        const y = inv * inv * o.y0 + 2 * inv * ease * o.cy + ease * ease * o.y1;

        ctx.save();
        const grad = ctx.createRadialGradient(x, y, 1, x, y, 14);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.35, "#fef08a");
        grad.addColorStop(0.7, "#f59e0b");
        grad.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (t >= 1) {
          spawnSparkles(o.x1, o.y1, ["#fef08a", "#fbbf24", "#f97316", "#ffffff"], 8, 0.75);
          if (typeof o.onHit === "function") o.onHit();
          orbs.splice(i, 1);
        }
      }

      // 5) Boss Purple-Red Forked Lightning Bolts
      for (let i = lightnings.length - 1; i >= 0; i--) {
        const l = lightnings[i];
        l.life += dt;
        if (l.life >= l.maxLife) {
          lightnings.splice(i, 1);
          continue;
        }
        const fade = Math.max(0, 1 - l.life / l.maxLife);
        if (Math.random() < 0.45) {
          l.pts = buildLightningPolyline(l.x0, l.y0, l.x1, l.y1, 9);
        }
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Outer crimson-purple plasma glow
        ctx.globalAlpha = 0.85 * fade;
        ctx.strokeStyle = "#ec4899";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 9;
        ctx.beginPath();
        l.pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();

        // Inner bright white-violet core
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#fdf4ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        l.pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();

        // Impact flash circle on tile
        const flashGrad = ctx.createRadialGradient(l.x1, l.y1, 2, l.x1, l.y1, 28 * fade);
        flashGrad.addColorStop(0, "rgba(255,255,255,0.95)");
        flashGrad.addColorStop(0.45, "rgba(236,72,153,0.85)");
        flashGrad.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(l.x1, l.y1, 28 * fade, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6) Crystal Shards & Sparkle Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 240 * dt;
        pt.rot += pt.vrot * dt;
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        if (pt.shape === "shard") {
          ctx.beginPath();
          ctx.moveTo(0, -pt.size * 1.4);
          ctx.lineTo(pt.size * 0.75, 0);
          ctx.lineTo(0, pt.size * 1.4);
          ctx.lineTo(-pt.size * 0.75, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, pt.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();

      const hasWork =
        smokeActive ||
        smokeParticles.length > 0 ||
        beams.length > 0 ||
        bolts.length > 0 ||
        orbs.length > 0 ||
        lightnings.length > 0 ||
        particles.length > 0;

      if (hasWork) {
        vfxRaf = requestAnimationFrame(tick);
      } else {
        vfxRaf = 0;
      }
    };
    vfxRaf = requestAnimationFrame(tick);
  }

  // ---- Ring & Boss HP DOM Updaters ----
  function updateChargeRingDOM(side, pct) {
    const circleId = side === "left" ? "heroLeftRingFill" : "heroRightRingFill";
    const wrapSel = side === "left" ? ".art-queen" : ".art-dragon";
    const badgeId = side === "left" ? "heroLeftReadyBadge" : "heroRightReadyBadge";
    const circle = document.getElementById(circleId);
    const wrap = document.querySelector(wrapSel);
    const badge = document.getElementById(badgeId);
    const clamped = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));

    if (circle) {
      circle.style.strokeDasharray = String(RING_CIRCUMFERENCE.toFixed(2));
      circle.style.strokeDashoffset = String(Engine.computeRingOffset(clamped, RING_CIRCUMFERENCE).toFixed(2));
    }
    const ready = clamped >= 100;
    if (wrap) {
      wrap.classList.toggle("is-ult-ready", ready);
      wrap.dataset.charge = String(clamped);
    }
    if (badge) {
      badge.classList.toggle("hidden", !ready);
    }
  }

  function updateBossHpBarDOM(hpPercent) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(hpPercent) || 0)));
    const fill = document.getElementById("bossHpFill");
    const text = document.getElementById("bossHpText");
    if (fill) {
      fill.style.transform = `scaleX(${(clamped / 100).toFixed(4)})`;
    }
    if (text) {
      text.textContent = `HP: ${clamped}%`;
    }
  }

  // ---- Public API ----
  let currentSetup = null;

  function configureForStage(globalStage, options = {}) {
    currentSetup = Engine.getStageCharacterSetup(globalStage, options);

    leftActor.stopLoops();
    rightActor.stopLoops();
    bossActor.stopLoops();
    leftActor.resetToIdle();
    rightActor.resetToIdle();
    bossActor.resetToIdle();

    const leftWrap = document.querySelector(".art-queen");
    const rightWrap = document.querySelector(".art-dragon");
    const bossStage = document.getElementById("bossArenaStage");
    const shell = document.getElementById("gameShell");

    if (currentSetup.isBossStage) {
      if (shell) shell.classList.add("is-boss-battle");
      if (leftWrap) leftWrap.classList.add("is-boss-hidden");
      if (rightWrap) rightWrap.classList.add("is-boss-hidden");
      if (bossStage) bossStage.classList.remove("hidden");

      bossActor.setSheet(currentSetup.bossSheet);
      bossActor.startIdleLoop("boss");
      updateBossHpBarDOM(100);
      smokeActive = true;
      ensureVfxLoop();
    } else {
      smokeActive = false;
      smokeParticles.length = 0;
      if (shell) shell.classList.remove("is-boss-battle");
      if (leftWrap) {
        leftWrap.classList.remove("is-boss-hidden");
        leftWrap.setAttribute("aria-label", currentSetup.leftHeroNameAr);
        leftWrap.dataset.heroId = currentSetup.leftHeroId;
      }
      if (rightWrap) {
        rightWrap.classList.remove("is-boss-hidden");
        rightWrap.setAttribute("aria-label", currentSetup.rightHeroNameAr);
        rightWrap.dataset.heroId = currentSetup.rightHeroId;
      }
      if (bossStage) bossStage.classList.add("hidden");

      leftActor.setSheet(currentSetup.leftHeroSheet);
      rightActor.setSheet(currentSetup.rightHeroSheet, { continuousFlap: true });
      leftActor.startIdleLoop("hero");
      rightActor.startIdleLoop("dragon");
    }

    return currentSetup;
  }

  function stopAll() {
    smokeActive = false;
    leftActor.stopLoops();
    rightActor.stopLoops();
    bossActor.stopLoops();
    particles.length = 0;
    beams.length = 0;
    bolts.length = 0;
    orbs.length = 0;
    lightnings.length = 0;
    smokeParticles.length = 0;
  }

  function onHeroReaction(kind) {
    if (currentSetup?.isBossStage) return;
    if (kind === "normal") {
      leftActor.playHappy();
      rightActor.playHappy();
    } else if (kind === "special" || kind === "celebrate") {
      leftActor.playCelebrate("is-celebrate-hop");
      rightActor.playCelebrate("is-celebrate-hop");
      const lc = getElementCenterLocal(document.querySelector(".art-queen"));
      const rc = getElementCenterLocal(document.querySelector(".art-dragon"));
      if (lc) spawnSparkles(lc.x, lc.y, ["#f472b6", "#fde047", "#ffffff"], 10, 0.7);
      if (rc) spawnSparkles(rc.x, rc.y, ["#38bdf8", "#fde047", "#ffffff"], 10, 0.7);
    }
  }

  function fireDragonCrystalBeam(anchorCell, clusterCells, onImpact) {
    rightActor.playCelebrate("is-lunge");
    playBattleSfx("crystal_beam");
    const origin = getElementCenterLocal(document.querySelector(".art-dragon")) || { x: 260, y: 120 };
    const target = getCellCenterLocal(anchorCell.r, anchorCell.c);

    beams.push({
      x0: origin.x - 6,
      y0: origin.y + 12,
      x1: target.x,
      y1: target.y,
      life: 0,
      maxLife: 0.62,
    });
    ensureVfxLoop();

    setTimeout(() => {
      spawnSparkles(target.x, target.y, ["#38bdf8", "#7dd3fc", "#fde047", "#ffffff"], 26, 1.35);
      for (const cell of clusterCells || []) {
        const pt = getCellCenterLocal(cell.r, cell.c);
        spawnSparkles(pt.x, pt.y, ["#38bdf8", "#bae6fd", "#fde047"], 6, 0.8);
      }
      if (typeof onImpact === "function") onImpact();
    }, 180);
  }

  function fireLeftHeroMagicBolts(heroId, targetCells, onEachArrive, onAllDone) {
    leftActor.playCelebrate("is-celebrate-hop");
    playBattleSfx("magic_bolt");
    const origin = getElementCenterLocal(document.querySelector(".art-queen")) || { x: 130, y: 120 };
    const isPharaoh = heroId === "pharaoh_boy";
    const colorCore = isPharaoh ? "#fde047" : "#f472b6";
    const colorGlow = isPharaoh ? "#38bdf8" : "#fbbf24";

    const cells = Array.isArray(targetCells) ? targetCells : [];
    if (!cells.length) {
      if (typeof onAllDone === "function") onAllDone();
      return;
    }

    let remaining = cells.length;
    cells.forEach((cell, idx) => {
      const dst = getCellCenterLocal(cell.r, cell.c);
      bolts.push({
        x0: origin.x + 8,
        y0: origin.y + 6,
        cx: (origin.x + dst.x) * 0.5 + (idx % 2 === 0 ? -42 : 42),
        cy: Math.min(origin.y, dst.y) - 18,
        x1: dst.x,
        y1: dst.y,
        life: -idx * 0.07,
        duration: 0.36,
        colorCore,
        colorGlow,
        onArrive: () => {
          if (typeof onEachArrive === "function") onEachArrive(cell);
          remaining--;
          if (remaining <= 0 && typeof onAllDone === "function") onAllDone();
        },
      });
    });
    ensureVfxLoop();
  }

  function fireGoldenEnergyOrbsToBoss(sourceCell, orbsCount, onBossOrbHit) {
    const bossEl = document.getElementById("bossCenterSprite");
    const dst = getElementCenterLocal(bossEl) || { x: 195, y: 112 };
    const src = sourceCell ? getCellCenterLocal(sourceCell.r, sourceCell.c) : { x: 195, y: 420 };
    const n = Math.max(2, Math.min(4, Math.floor(Number(orbsCount) || 2)));
    let hitCalled = false;

    for (let i = 0; i < n; i++) {
      const spreadX = (i - (n - 1) / 2) * 38;
      orbs.push({
        x0: src.x + (Math.random() - 0.5) * 18,
        y0: src.y + (Math.random() - 0.5) * 18,
        cx: (src.x + dst.x) * 0.5 + spreadX,
        cy: (src.y + dst.y) * 0.5 - 40,
        x1: dst.x + (Math.random() - 0.5) * 20,
        y1: dst.y + (Math.random() - 0.5) * 16,
        life: -i * 0.055,
        duration: 0.42,
        onHit: () => {
          if (!hitCalled) {
            hitCalled = true;
            bossActor.playBossFlinch();
            playBattleSfx("boss_hit");
            if (typeof onBossOrbHit === "function") onBossOrbHit();
          }
        },
      });
    }
    ensureVfxLoop();
  }

  function playBossPunishmentAttack(targetCells, onStrikeImpact, onComplete) {
    const bossEl = document.getElementById("bossCenterSprite");
    const bossCenter = getElementCenterLocal(bossEl) || { x: 195, y: 112 };
    // Scepter tip is upper-right of the seated Red Gummy Bear Boss
    const scepterX = bossCenter.x + 34;
    const scepterY = bossCenter.y - 26;

    bossActor.playBossPunishmentSequence(
      () => {
        for (const cell of targetCells || []) {
          const dst = getCellCenterLocal(cell.r, cell.c);
          lightnings.push({
            x0: scepterX,
            y0: scepterY,
            x1: dst.x,
            y1: dst.y,
            pts: buildLightningPolyline(scepterX, scepterY, dst.x, dst.y, 9),
            life: 0,
            maxLife: 0.72,
          });
          spawnSparkles(dst.x, dst.y, ["#ec4899", "#ef4444", "#f5d0fe", "#ffffff"], 14, 1.0);
        }
        ensureVfxLoop();
        if (typeof onStrikeImpact === "function") onStrikeImpact();
      },
      onComplete
    );
  }

  function playBossDefeat() {
    bossActor.playBossDefeatBurst();
    const bossEl = document.getElementById("bossCenterSprite");
    const c = getElementCenterLocal(bossEl) || { x: 195, y: 112 };
    spawnSparkles(c.x, c.y, ["#fde047", "#fb7185", "#f97316", "#38bdf8", "#ffffff"], 36, 1.6);
    smokeActive = false;
  }

  window.CMRHeroBossVFX = {
    configureForStage,
    stopAll,
    updateChargeRingDOM,
    updateBossHpBarDOM,
    onHeroReaction,
    fireDragonCrystalBeam,
    fireLeftHeroMagicBolts,
    fireGoldenEnergyOrbsToBoss,
    playBossPunishmentAttack,
    playBossEvilLaugh: () => bossActor.playBossEvilLaugh(),
    playBossDefeat,
    getSetup: () => currentSetup,
    getFrames: () => ({
      left: leftActor.getFrame(),
      right: rightActor.getFrame(),
      boss: bossActor.getFrame(),
    }),
  };
})();
