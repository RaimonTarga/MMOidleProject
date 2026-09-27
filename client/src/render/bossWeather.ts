/**
 * BOSS WEATHER — a screen-space ambience layer for intense boss phases
 * (boss-lineage redesign): Tundra's Blizzard, Volcanic ash fall, the Trench's
 * "into the dark" abyss, the Desert sandstorm and the Swamp's rot spores. Purely presentational: the server only publishes a tag
 * (`hasStatus.bossWeather` on the boss), never any gameplay.
 *
 * Budget, by design: ONE Graphics object redrawn per frame (one batched draw), a
 * capped pool of particles, no tweens, and nothing at all while the tab is hidden
 * or client FX are off. The same layer can later drive dynamic node weather.
 */
import type { MonsterView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/game/GameScene";
import { shouldRunClientFx } from "../fx/guard";
import { screenSpaceScale } from "./cameraZoom";
import { DEPTH } from "./depth";

type Weather = NonNullable<MonsterView["bossWeather"]>;

interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number }

interface WeatherLayer {
  graphic: Phaser.GameObjects.Graphics;
  weather: Weather | null;
  /** 0..1 fade: in when a weather starts, out when it clears. */
  strength: number;
  particles: Particle[];
  t: number;
}

// Blizzard spawns across a wider band (see BLIZZARD_DRIFT), so it needs more flakes
// for the same on-screen density.
// Ashfall denser since the 2026-09-27 playtest (140 -> 340).
const MAX_PARTICLES: Record<Weather, number> = { blizzard: 320, ashfall: 340, abyss: 0, sandstorm: 260, spores: 110 };
const layers = new WeakMap<GameScene, WeatherLayer>();

function currentWeather(scene: GameScene): Weather | null {
  for (const [id, view] of scene.state.view) {
    if (scene.state.kind.get(id) !== "monster") continue;
    const weather = (view as MonsterView).bossWeather;
    if (weather) return weather;
  }
  return null;
}

/**
 * Blizzard snow drifts LEFT as it falls (up to ~1.2 px sideways per px down), so a
 * flake that reaches the bottom-right corner has to start well past the right edge.
 * Spawning only across the screen width left that corner bare (playtest 2026-09-27).
 */
const BLIZZARD_DRIFT = 1.2;

function spawn(weather: Weather, w: number, h: number, anywhere: boolean): Particle {
  if (weather === "blizzard") {
    const x = anywhere
      ? Math.random() * w * 1.1 - w * 0.05
      : Math.random() * (w + h * BLIZZARD_DRIFT) - w * 0.05;
    const y = anywhere ? Math.random() * h : -10;
    return { x, y, vx: -140 - Math.random() * 120, vy: 220 + Math.random() * 180, size: 1.5 + Math.random() * 2, life: 1 };
  }
  if (weather === "sandstorm") {
    // Driven sideways, hard: spawns off the left edge (or anywhere on the first fill).
    const x = anywhere ? Math.random() * w : -30 - Math.random() * 60;
    const y = Math.random() * h;
    return { x, y, vx: 520 + Math.random() * 380, vy: 30 + Math.random() * 60, size: 1 + Math.random() * 2, life: Math.random() };
  }
  if (weather === "spores") {
    // Rising slowly from below, wobbling; a few glow.
    const x = Math.random() * w;
    const y = anywhere ? Math.random() * h : h + 10;
    return { x, y, vx: -10 + Math.random() * 20, vy: -(18 + Math.random() * 30), size: 1.5 + Math.random() * 2.5, life: Math.random() };
  }
  const x = Math.random() * w * 1.2 - w * 0.1;
  const y = anywhere ? Math.random() * h : -10;
  // Ash: slow, drifting, some of it still glowing.
  return { x, y, vx: -20 + Math.random() * 40, vy: 30 + Math.random() * 40, size: 1.8 + Math.random() * 2.8, life: Math.random() };
}

/** Per-frame: fade the layer toward the current boss weather and draw it. */
export function updateBossWeather(scene: GameScene, dtMs: number): void {
  let layer = layers.get(scene);
  const target = shouldRunClientFx() && !document.hidden ? currentWeather(scene) : null;
  if (!layer) {
    if (!target) return;
    layer = {
      graphic: scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.FX + 1000),
      weather: target,
      strength: 0,
      particles: [],
      t: 0,
    };
    layers.set(scene, layer);
  }
  if (document.hidden) return;
  const dt = Math.min(0.1, dtMs / 1000);
  // A weather change fades the old one out before the new one fades in.
  if (target && target === layer.weather) layer.strength = Math.min(1, layer.strength + dt / 1.5);
  else layer.strength = Math.max(0, layer.strength - dt / 1.2);
  if (layer.strength <= 0) {
    layer.graphic.clear();
    layer.particles.length = 0;
    layer.weather = target;
    return;
  }
  const weather = layer.weather!;
  layer.t += dt;

  const cam = scene.cameras.main;
  const k = screenSpaceScale(cam);
  const w = scene.scale.width * k;
  const h = scene.scale.height * k;
  const ox = scene.scale.width / 2 - w / 2;
  const oy = scene.scale.height / 2 - h / 2;
  const g = layer.graphic;
  g.clear();

  if (weather === "abyss") {
    // The room goes deeper: a darkening wash plus a few slow drifting caustic
    // bands standing in for water distortion.
    g.fillStyle(0x02101f, 0.42 * layer.strength);
    g.fillRect(ox, oy, w, h);
    for (let i = 0; i < 5; i++) {
      const phase = layer.t * (0.15 + i * 0.04) + i * 1.7;
      const cx = ox + w * (0.5 + 0.45 * Math.sin(phase));
      const cy = oy + h * (0.5 + 0.4 * Math.cos(phase * 0.8 + i));
      g.fillStyle(0x3a7fb0, 0.06 * layer.strength);
      g.fillEllipse(cx, cy, w * 0.5, h * 0.12);
    }
    return;
  }

  const cap = MAX_PARTICLES[weather];
  while (layer.particles.length < cap * layer.strength) {
    layer.particles.push(spawn(weather, w, h, layer.particles.length < cap / 2));
  }
  if (weather === "blizzard") {
    g.fillStyle(0xdff2ff, 0.10 * layer.strength);
    g.fillRect(ox, oy, w, h);
  } else if (weather === "sandstorm") {
    // A tan haze that breathes, plus a few broad gusts rolling across.
    g.fillStyle(0xc9a15a, (0.14 + 0.04 * Math.sin(layer.t * 1.3)) * layer.strength);
    g.fillRect(ox, oy, w, h);
    for (let i = 0; i < 3; i++) {
      const gx = ox + ((layer.t * (180 + i * 60) + i * w * 0.4) % (w * 1.6)) - w * 0.3;
      g.fillStyle(0xe0c080, 0.07 * layer.strength);
      g.fillEllipse(gx, oy + h * (0.25 + i * 0.25), w * 0.5, h * 0.18);
    }
  } else if (weather === "spores") {
    g.fillStyle(0x3d5a1a, 0.08 * layer.strength);
    g.fillRect(ox, oy, w, h);
  } else {
    g.fillStyle(0x2a1208, 0.12 * layer.strength);
    g.fillRect(ox, oy, w, h);
  }
  for (const p of layer.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Blizzard flakes may start off the right edge and drift in; only cull them
    // once they are past where any drift could still bring them on screen.
    const maxX = weather === "blizzard" ? w + h * BLIZZARD_DRIFT + 20 : w + 20;
    const minX = weather === "sandstorm" ? -100 : -20;
    if (weather === "spores") p.x += Math.sin(layer.t * 1.6 + p.life * 20) * 12 * dt;
    if (p.y > h + 10 || p.y < -20 || p.x < minX || p.x > maxX) Object.assign(p, spawn(weather, w, h, false));
    if (weather === "sandstorm") {
      // Streaks, not dots: sand driven sideways.
      g.lineStyle(p.size, p.life > 0.7 ? 0xf0d9a0 : 0xc9a15a, 0.55 * layer.strength);
      g.lineBetween(ox + p.x, oy + p.y, ox + p.x - 14 - p.size * 4, oy + p.y - 1);
      continue;
    }
    if (weather === "spores") {
      const glow = p.life > 0.75;
      g.fillStyle(glow ? 0xd4f07a : 0x8ec43a, (glow ? 0.85 : 0.5) * layer.strength);
      g.fillCircle(ox + p.x, oy + p.y, p.size);
      continue;
    }
    if (weather === "blizzard") {
      g.fillStyle(0xffffff, 0.75 * layer.strength);
    } else {
      const glow = p.life > 0.8;
      g.fillStyle(glow ? 0xff8a3a : 0x6b625c, (glow ? 0.9 : 0.6) * layer.strength);
    }
    g.fillCircle(ox + p.x, oy + p.y, p.size);
  }
}
