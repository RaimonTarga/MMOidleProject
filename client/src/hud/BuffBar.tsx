import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import type { PlayerBuff } from '@mmo-idle/shared';

// Slot dimensions
const ICON_SIZE  = 32; // px — square placeholder shape
const BAR_HEIGHT = 3;  // px — duration bar below icon
const SLOT_GAP   = 6;  // px — gap between slots

function BuffIcon({ buff }: { buff: PlayerBuff }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>

      {/* Placeholder icon square */}
      <div style={{
        position:        'relative',
        width:           ICON_SIZE,
        height:          ICON_SIZE,
        backgroundColor: buff.color,
        borderRadius:    5,
        border:          '1.5px solid rgba(255,255,255,0.25)',
        boxShadow:       `0 0 6px ${buff.color}88`,
        flexShrink:      0,
      }}>
        {/* Stack count badge — bottom-right corner, only when > 1 */}
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

      {/* Duration bar — only for timed buffs (durationPct >= 0) */}
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
