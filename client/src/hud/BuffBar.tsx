import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { PlayerBuff } from '@mmo-idle/shared';
import '../hud/hud.css';

// Slot dimensions
const ICON_SIZE  = 32;
const BAR_HEIGHT = 3;
const SLOT_GAP   = 6;

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
  if (id === 'dot-vigor')         return 'dot-poison'; // Invigorating Toxins
  if (id === 'dot-conflag')       return 'dot-fire';   // Conflagration
  if (id === 'dot-chill')         return 'dot-frost';  // Freezing Cold chill
  if (id === 'dot-frozen')        return 'dot-frozen'; // Freezing Cold frozen
  if (id === 'sacred-burst')      return 'weapon';
  return null;
}

/** Extra CSS shape properties applied per buff to visually distinguish DoT paths. */
function getIconShapeStyle(id: string): React.CSSProperties {
  if (id === 'dot-vigor') {
    // Poison — circular/organic
    return { borderRadius: '50%' };
  }
  if (id === 'dot-conflag') {
    // Fire — diamond
    return { borderRadius: 2, clipPath: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)' };
  }
  if (id === 'dot-frozen') {
    // Frozen — sharp crystalline corners
    return { borderRadius: 1 };
  }
  return {};
}

function BuffIcon({ buff }: { buff: PlayerBuff }) {
  const category = getBuffCategory(buff.id);
  const shapeStyle = getIconShapeStyle(buff.id);
  const catClass = category ? `buff-icon buff-cat-${category}` : 'buff-icon';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>

      {/* Icon — shape + color + category animation */}
      <div
        className={catClass}
        style={{
          position:        'relative',
          width:           ICON_SIZE,
          height:          ICON_SIZE,
          backgroundColor: buff.color,
          border:          '1.5px solid rgba(255,255,255,0.22)',
          boxShadow:       `0 0 7px ${buff.color}99, 0 0 2px rgba(0,0,0,0.6)`,
          flexShrink:      0,
          ...shapeStyle,
        }}
      >
        {/* Stack count badge — bottom-right, only when > 1 */}
        {buff.stacks > 1 && (
          <span style={{
            position:   'absolute',
            bottom:     2,
            right:      3,
            fontSize:   10,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color:      '#fff',
            textShadow: '1px 1px 0 #000, -1px 0 0 #000',
            lineHeight: 1,
          }}>
            {buff.stacks}
          </span>
        )}
      </div>

      {/* Duration bar — only for timed buffs */}
      {buff.durationPct >= 0 && (
        <div style={{
          width:           ICON_SIZE,
          height:          BAR_HEIGHT,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius:    2,
          overflow:        'hidden',
          flexShrink:      0,
        }}>
          <div style={{
            width:           `${Math.max(0, Math.min(100, buff.durationPct))}%`,
            height:          '100%',
            backgroundColor: buff.color,
          }} />
        </div>
      )}

      {/* Short label */}
      <span style={{
        fontSize:   9,
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
      bottom:         12,
      left:           12,
      display:        'flex',
      flexDirection:  'row',
      gap:            SLOT_GAP,
      alignItems:     'flex-end',
      pointerEvents:  'none',
      zIndex:         10,
    }}>
      {buffs.map(buff => <BuffIcon key={buff.id} buff={buff} />)}
    </div>
  );
}
