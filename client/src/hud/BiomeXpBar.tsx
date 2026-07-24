import { useAtomValue } from 'jotai';
import {
  NODE_BIOMES, BIOME_DATABASE, biomeXpForBiomeLevel, biomeLevelCap,
  NODE_MODIFIERS, PACE_FAMILY_COLORS, PACE_FAMILY_LABELS, PACE_FAMILY_SUMMARIES,
} from '@mmo-idle/shared';
import { useState, useEffect, useRef } from 'react';
import { biomeXPAtom, biomeLevelAtom, playerNodeIdAtom, playerTierAtom } from './atoms';
import './biomeXpBar.css';

const MAX_PLAYER_TIER = 7;
const TICK_POSITIONS = Array.from({ length: 9 }, (_, i) => (i + 1) * 10);

function deriveBarState(
  totalXp: number,
  level: number,
  playerTier: number,
  biomeGroup: string,
) {
  const levelCap = biomeLevelCap(playerTier, biomeGroup);
  const absoluteMax = biomeLevelCap(MAX_PLAYER_TIER, biomeGroup);
  const isMaxed = level >= absoluteMax;
  const isCapped = !isMaxed && level >= levelCap;

  const xpThisLevel = biomeXpForBiomeLevel(biomeGroup, level);
  const xpNextLevel = biomeXpForBiomeLevel(biomeGroup, level + 1);
  const xpInLevel = Math.max(0, totalXp - xpThisLevel);
  const xpNeeded = xpNextLevel - xpThisLevel;
  const pct = (isMaxed || isCapped) ? 100 : Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));

  return { pct, isMaxed, isCapped, xpInLevel, xpNeeded };
}

export function BiomeXpBar() {
  const nodeId     = useAtomValue(playerNodeIdAtom);
  const biomeXP    = useAtomValue(biomeXPAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const playerTier = useAtomValue(playerTierAtom);

  const nodeInfo   = nodeId ? NODE_BIOMES[nodeId] : null;
  const biomeGroup = nodeInfo?.biomeGroup ?? null;
  const biome      = biomeGroup ? BIOME_DATABASE.get(biomeGroup) : null;
  const tier       = nodeInfo?.biomeTier ?? 0;

  const level    = (biomeGroup ? biomeLevel[biomeGroup] : null) ?? 0;
  const totalXp  = (biomeGroup ? biomeXP[biomeGroup] : null) ?? 0;

  const { pct: targetPct, isMaxed, isCapped, xpInLevel, xpNeeded } = biomeGroup
    ? deriveBarState(totalXp, level, playerTier, biomeGroup)
    : { pct: 0, isMaxed: false, isCapped: false, xpInLevel: 0, xpNeeded: 0 };

  const [displayPct, setDisplayPct]   = useState(targetPct);
  const [noTransition, setNoTransition] = useState(false);

  const fillRef        = useRef<HTMLDivElement>(null);
  const prevBiomeRef   = useRef(biomeGroup);
  const prevXpRef      = useRef(totalXp);
  const prevLevelRef   = useRef(level);
  const targetPctRef   = useRef(targetPct);
  targetPctRef.current = targetPct;

  useEffect(() => {
    const prevBiome = prevBiomeRef.current;
    const prevXp    = prevXpRef.current;
    const prevLevel = prevLevelRef.current;

    prevBiomeRef.current  = biomeGroup;
    prevXpRef.current     = totalXp;
    prevLevelRef.current  = level;

    // Biome change — instant snap, no animation
    if (biomeGroup !== prevBiome) {
      setNoTransition(true);
      setDisplayPct(targetPctRef.current);
      requestAnimationFrame(() => setNoTransition(false));
      return;
    }

    if (totalXp === prevXp && level === prevLevel) return;

    // Glow flash on XP gain (not on max/capped fills — their pulse handles it)
    if (!isMaxed && !isCapped) {
      const fill = fillRef.current;
      if (fill) {
        fill.style.filter = 'brightness(2.4)';
        requestAnimationFrame(() => { if (fill) fill.style.filter = ''; });
      }
    }

    if (level > prevLevel) {
      // Level-up: slide bar to 100%, snap to 0, then fill to new progress
      setNoTransition(false);
      setDisplayPct(100);
      setTimeout(() => {
        setNoTransition(true);
        setDisplayPct(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setNoTransition(false);
            setDisplayPct(targetPctRef.current);
          });
        });
      }, 460);
    } else {
      setNoTransition(false);
      setDisplayPct(targetPctRef.current);
    }
  }, [biomeGroup, totalXp, level]);

  if (!biomeGroup || !nodeId) return null;

  const biomeName = biome?.name ?? biomeGroup;
  const modifier  = NODE_MODIFIERS[nodeId];

  let levelLabel    = `Lv ${level}`;
  let levelModClass = '';
  let fillModClass  = '';
  let statusText: string | null = null;
  let statusModClass = '';

  if (isMaxed) {
    levelLabel    = 'MAX';
    levelModClass = 'biome-xp-bar__level--max';
    fillModClass  = 'biome-xp-bar__fill--max';
    statusText    = 'Max level reached';
    statusModClass = 'biome-xp-bar__status--max';
  } else if (isCapped) {
    levelLabel    = 'CAPPED';
    levelModClass = 'biome-xp-bar__level--capped';
    fillModClass  = 'biome-xp-bar__fill--capped';
    statusText    = 'Advance to the next tier to reach higher levels';
    statusModClass = 'biome-xp-bar__status--capped';
  }

  const fillClass = [
    'biome-xp-bar__fill',
    fillModClass,
    noTransition ? 'biome-xp-bar__fill--no-transition' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="biome-xp-bar">
      <div className="biome-xp-bar__header">
        <span className="biome-xp-bar__biome">{biomeName} T{tier}</span>
        {modifier && (
          <span
            className="biome-xp-bar__family"
            style={{ background: PACE_FAMILY_COLORS[modifier.pace] }}
            title={PACE_FAMILY_SUMMARIES[modifier.pace]}
          >
            {PACE_FAMILY_LABELS[modifier.pace]}
          </span>
        )}
        <span className={`biome-xp-bar__level${levelModClass ? ` ${levelModClass}` : ''}`}>
          {levelLabel}
        </span>
        {!isMaxed && !isCapped && (
          <span className="biome-xp-bar__xp">{xpInLevel} / {xpNeeded} XP</span>
        )}
      </div>

      <div className="biome-xp-bar__track">
        <div
          ref={fillRef}
          className={fillClass}
          style={{ width: `${displayPct}%` }}
        />
        <div className="biome-xp-bar__ticks" aria-hidden="true">
          {TICK_POSITIONS.map((pos) => (
            <div key={pos} className="biome-xp-bar__tick" style={{ left: `${pos}%` }} />
          ))}
        </div>
      </div>

      {statusText && (
        <div className={`biome-xp-bar__status ${statusModClass}`}>{statusText}</div>
      )}
    </div>
  );
}
