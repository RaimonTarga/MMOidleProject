import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { PlayerBuff } from '@mmo-idle/shared';
import '../hud/hud.css';

const ICON_SIZE = 52;
const SLOT_GAP  = 8;

type BuffCategory =
  | 'cadence'
  | 'cooldown'
  | 'energy'
  | 'dot-poison'
  | 'dot-fire'
  | 'dot-frost'
  | 'dot-frozen'
  | 'weapon';

function getBuffCategory(id: string): BuffCategory | null {
  if (id.startsWith('cadence-'))  return 'cadence';
  if (id.startsWith('cooldown-')) return 'cooldown';
  if (id.startsWith('energy-'))   return 'energy';
  if (id === 'dot-vigor')         return 'dot-poison';
  if (id === 'dot-conflag')       return 'dot-fire';
  if (id === 'dot-chill')         return 'dot-frost';
  if (id === 'dot-frozen')        return 'dot-frozen';
  if (id === 'sacred-burst')      return 'weapon';
  return null;
}

function getIconShapeStyle(id: string): React.CSSProperties {
  if (id === 'dot-vigor') {
    return { borderRadius: '50%' };
  }
  if (id === 'dot-conflag') {
    return { borderRadius: 2, clipPath: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)' };
  }
  if (id === 'dot-frozen') {
    return { borderRadius: 1 };
  }
  return {};
}

function BuffIcon({ buff }: { buff: PlayerBuff }) {
  const category   = getBuffCategory(buff.id);
  const shapeStyle = getIconShapeStyle(buff.id);
  const catClass   = category ? `buff-icon buff-cat-${category}` : 'buff-icon';
  const hasDuration = buff.durationPct >= 0;

  // Sweep overlay: darkened area sweeps clockwise from the top as the buff elapses.
  // At 100% remaining → 0% dark (fully visible); at 0% remaining → 100% dark.
  const elapsed = hasDuration ? Math.max(0, Math.min(100, 100 - buff.durationPct)) : 0;

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            4,
    }}>

      {/* Icon with optional clock-sweep overlay */}
      <div
        className={catClass}
        style={{
          position:        'relative',
          width:           ICON_SIZE,
          height:          ICON_SIZE,
          backgroundColor: buff.color,
          border:          '1.5px solid rgba(255,255,255,0.22)',
          boxShadow:       `0 0 10px ${buff.color}99, 0 0 3px rgba(0,0,0,0.7)`,
          flexShrink:      0,
          ...shapeStyle,
        }}
      >
        {/* Clockface darkening overlay — grows clockwise from the top as time elapses */}
        {hasDuration && (
          <div style={{
            position:      'absolute',
            inset:         0,
            background:    `conic-gradient(from -90deg, rgba(0,0,0,0.68) ${elapsed}%, transparent ${elapsed}%)`,
            borderRadius:  'inherit',
            clipPath:      shapeStyle.clipPath as string | undefined,
            pointerEvents: 'none',
          }} />
        )}

        {/* Stack count badge — bottom-right corner, above the sweep */}
        {buff.stacks > 1 && (
          <span style={{
            position:   'absolute',
            bottom:     3,
            right:      4,
            fontSize:   12,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color:      '#fff',
            textShadow: '1px 1px 0 #000, -1px 0 0 #000',
            lineHeight: 1,
            zIndex:     2,
          }}>
            {buff.stacks}
          </span>
        )}
      </div>

      {/* Short label */}
      <span style={{
        fontSize:   10,
        fontFamily: 'monospace',
        color:      buff.color,
        textShadow: '1px 1px 0 #000',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {buff.label}
      </span>
    </div>
  );
}

export function BuffBar() {
  const [buffs, setBuffs] = useState<PlayerBuff[]>([]);

  useEffect(() => hudBus.subscribe((state) => {
    setBuffs(state.player?.activeBuffs ?? []);
  }), []);

  if (buffs.length === 0) return null;

  return (
    <div style={{
      position:       'absolute',
      top:            12,
      left:           12,
      display:        'flex',
      flexDirection:  'row',
      gap:            SLOT_GAP,
      alignItems:     'flex-start',
      pointerEvents:  'none',
      zIndex:         10,
    }}>
      {buffs.map(buff => <BuffIcon key={buff.id} buff={buff} />)}
    </div>
  );
}
