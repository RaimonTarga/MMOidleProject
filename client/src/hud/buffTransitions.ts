import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BuffId, PlayerBuff } from "@mmo-idle/shared";

/**
 * Buff-bar transition tracking: which tiles just gained stacks, which were just
 * cleansed, and which are on their way out.
 *
 * Everything here is COSMETIC and derived only from successive buff lists plus
 * the `player-cleansed` receipt stamp. Appearing needs no tracking at all — a new
 * tile is a new React key, and its entrance is a mount animation.
 */

/**
 * Critical debuffs: the ones that decide a fight if ignored. They sort to the
 * front of the bar and get the bright treatment.
 */
export const CRITICAL_BUFF_IDS: ReadonlySet<BuffId> = new Set<BuffId>([
  "debuff-sun-mark",
  "debuff-stunned",
  "debuff-frozen",
]);

/**
 * High-impact stacking debuffs: each gained stack is announced with a hot surge,
 * and the tile's resting glow deepens with the stack count.
 */
export const SURGE_DEBUFF_IDS: ReadonlySet<BuffId> = new Set<BuffId>([
  "debuff-volcanic-heat",
  "debuff-tundra-chill",
  "debuff-swamp-rot",
  "debuff-frost-ramp",
  "debuff-sundered",
  "debuff-plating-shred",
]);

/**
 * How far apart a cleanse event and the buff change it caused may land. The
 * event and the shrunk buff list travel on the same delta but are applied by
 * different seams, so either can arrive first.
 */
const CLEANSE_WINDOW_MS = 700;
/** Ghost lifetimes: long enough for the exit animation, with slack for jank. */
const FADE_MS = 320;
const SHATTER_MS = 720;

export function isHarmfulBuff(buff: PlayerBuff): boolean {
  return buff.id.startsWith("debuff-") || buff.logSourceSide === "enemy";
}

export function buffKey(buff: PlayerBuff): string {
  return `${buff.instanceKey ?? buff.iconKey}:${buff.id}`;
}

export type GhostKind = "fade" | "shatter";

export interface BuffGhost {
  key: string;
  buff: PlayerBuff;
  /** Position in the display order when the tile left, so the gap closes late. */
  index: number;
  kind: GhostKind;
  at: number;
}

export interface BuffTileFx {
  /** Incremented per stack gain; used as a React key to replay the surge. */
  surgeN: number;
  surgeKind: "harm" | "boon";
  /** Incremented per partial cleanse (stacks stripped, tile survives). */
  burstN: number;
}

/** Display order: critical debuffs first, otherwise the server's order. */
export function orderBuffs(buffs: readonly PlayerBuff[]): PlayerBuff[] {
  const critical = buffs.filter((b) => CRITICAL_BUFF_IDS.has(b.id));
  if (critical.length === 0) return [...buffs];
  return [...critical, ...buffs.filter((b) => !CRITICAL_BUFF_IDS.has(b.id))];
}

export function useBuffTransitions(
  ordered: readonly PlayerBuff[],
  lastCleanseAt: number,
): { ghosts: BuffGhost[]; fx: ReadonlyMap<string, BuffTileFx>; dropGhost: (key: string, at: number) => void } {
  const prevRef = useRef<Map<string, { buff: PlayerBuff; index: number }> | null>(null);
  const fxRef = useRef(new Map<string, BuffTileFx>());
  /** Harmful tiles that lost stacks recently, for a cleanse event that lands late. */
  const dropsRef = useRef(new Map<string, number>());
  const cleanseRef = useRef(lastCleanseAt);
  const [ghosts, setGhosts] = useState<BuffGhost[]>([]);
  const [, setVersion] = useState(0);

  // Layout effect, not effect: the removed tile must be replaced by its ghost in
  // the same paint, or it blinks out for a frame before fading.
  useLayoutEffect(() => {
    const now = Date.now();
    const prev = prevRef.current;
    const next = new Map<string, { buff: PlayerBuff; index: number }>();
    ordered.forEach((buff, index) => next.set(buffKey(buff), { buff, index }));
    prevRef.current = next;
    // First list seen: nothing to compare against, so nothing to announce.
    if (!prev) return;

    const recentCleanse = now - cleanseRef.current <= CLEANSE_WINDOW_MS;
    const fx = fxRef.current;
    let changed = false;
    const leaving: BuffGhost[] = [];

    for (const [key, was] of prev) {
      if (next.has(key)) continue;
      fx.delete(key);
      dropsRef.current.delete(key);
      const harmful = isHarmfulBuff(was.buff);
      leaving.push({
        key,
        buff: was.buff,
        index: was.index,
        kind: harmful && recentCleanse ? "shatter" : "fade",
        at: now,
      });
    }

    for (const [key, cur] of next) {
      const was = prev.get(key);
      if (!was) continue;
      const harmful = isHarmfulBuff(cur.buff);
      if (cur.buff.stacks > was.buff.stacks) {
        // Only the named high-impact debuffs surge; an ordinary debuff gaining a
        // stack is already told by its badge. Every boon surges, gently.
        if (harmful && !SURGE_DEBUFF_IDS.has(cur.buff.id)) continue;
        const entry = fx.get(key) ?? { surgeN: 0, surgeKind: "boon", burstN: 0 };
        entry.surgeN += 1;
        entry.surgeKind = harmful ? "harm" : "boon";
        fx.set(key, entry);
        changed = true;
      } else if (harmful && cur.buff.stacks < was.buff.stacks) {
        dropsRef.current.set(key, now);
        if (recentCleanse) {
          const entry = fx.get(key) ?? { surgeN: 0, surgeKind: "harm", burstN: 0 };
          entry.burstN += 1;
          fx.set(key, entry);
          changed = true;
        }
      }
    }

    if (leaving.length > 0 || next.size > 0) {
      setGhosts((g) => {
        // A tile that came back supersedes its own ghost.
        const kept = g.filter((ghost) => !next.has(ghost.key));
        return leaving.length > 0 || kept.length !== g.length ? [...kept, ...leaving] : g;
      });
    }
    if (changed) setVersion((v) => v + 1);
  }, [ordered]);

  // The cleanse event landed AFTER the buff change it caused: upgrade the quiet
  // exits and stack drops that happened just before it.
  useLayoutEffect(() => {
    if (lastCleanseAt === cleanseRef.current) return;
    cleanseRef.current = lastCleanseAt;
    const since = lastCleanseAt - CLEANSE_WINDOW_MS;
    const now = Date.now();
    setGhosts((g) => {
      let upgraded = false;
      const out = g.map((ghost) => {
        if (ghost.kind !== "fade" || ghost.at < since || !isHarmfulBuff(ghost.buff)) return ghost;
        upgraded = true;
        return { ...ghost, kind: "shatter" as const, at: now };
      });
      return upgraded ? out : g;
    });
    let changed = false;
    for (const [key, at] of dropsRef.current) {
      if (at < since) {
        dropsRef.current.delete(key);
        continue;
      }
      const entry = fxRef.current.get(key);
      if (!entry) {
        fxRef.current.set(key, { surgeN: 0, surgeKind: "harm", burstN: 1 });
      } else {
        entry.burstN += 1;
      }
      dropsRef.current.delete(key);
      changed = true;
    }
    if (changed) setVersion((v) => v + 1);
  }, [lastCleanseAt]);

  // Timer backstop for ghost removal. `onAnimationEnd` is the normal path; this
  // covers a hidden tab, where animations may never run to their end event.
  useEffect(() => {
    if (ghosts.length === 0) return;
    const now = Date.now();
    const due = Math.min(
      ...ghosts.map((g) => g.at + (g.kind === "shatter" ? SHATTER_MS : FADE_MS) + 400),
    );
    const id = window.setTimeout(() => {
      const t = Date.now();
      setGhosts((g) =>
        g.filter((ghost) => t < ghost.at + (ghost.kind === "shatter" ? SHATTER_MS : FADE_MS) + 400),
      );
    }, Math.max(0, due - now));
    return () => window.clearTimeout(id);
  }, [ghosts]);

  const dropGhost = (key: string, at: number) =>
    setGhosts((g) => g.filter((ghost) => !(ghost.key === key && ghost.at === at)));

  return { ghosts, fx: fxRef.current, dropGhost };
}
