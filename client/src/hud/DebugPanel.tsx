import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  DEBUG_REWARD_MULT_MAX,
  DEBUG_REWARD_MULT_MIN,
  TEST_ROOM_NODE_ID,
  clampRewardMultiplier,
} from '@mmo-idle/shared';
import { DEV_TOOLS_ENABLED } from '../devTools';
import { hudBus } from '../hudBus';
import {
  attackAtom,
  attackCooldownAtom,
  attackStyleAtom,
  autoAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceSpeedStacksAtom,
  cadenceThresholdAtom,
  combatArchetypeAtom,
  hpAtom,
  lastAttackAtAtom,
  maxHpAtom,
  passivesAtom,
  playerIdAtom,
  playerNameAtom,
  playerNodeIdAtom,
  debugPanelOpenAtom,
  rewardMultiplierAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
} from './atoms';

// ── Entry model ───────────────────────────────────────────────────────────────
// Add new section builders below; the component renders any DebugSection[]
// without changes.  Backtick (rebindable in Settings) toggles the panel.

type DebugValue = string | number | boolean | null | undefined;
type DebugEntry =
  | { kind: 'row';     key: string; value: DebugValue }
  | { kind: 'divider'; label: string };

interface DebugSection {
  id:      string;
  label:   string;
  entries: DebugEntry[];
}

interface DebugPlayer {
  cadenceCount: number;
  cadenceThreshold: number;
  cadenceEmpoweredArmed: boolean;
  selectedSubVariant: string | null;
  selectedRange: string | null;
  cadenceSpeedStacks: number;
  passives: Record<string, number | undefined>;
  lastAttackAt: number;
  combatArchetype: string | null;
  nodeId: string;
  auto: boolean;
  attack: number;
  attackCooldown: number;
  attackStyle: string;
  hp: number;
  maxHp: number;
}

const row = (key: string, value: DebugValue): DebugEntry => ({ kind: 'row', key, value });
const div = (label: string):                  DebugEntry => ({ kind: 'divider', label });

// ── Section builders ──────────────────────────────────────────────────────────

function buildCadenceSection(p: DebugPlayer): DebugSection {
  const count     = p.cadenceCount;
  const threshold = p.cadenceThreshold;
  const armed     = p.cadenceEmpoweredArmed;
  const until     = armed ? 0 : Math.max(0, (threshold - 1) - count);

  const timeline = Array.from({ length: 8 }, (_, i) => {
    const delta = i - until;
    return delta >= 0 && delta % threshold === 0 ? 'F' : '·';
  }).join(' ');

  const entries: DebugEntry[] = [
    row('variant',   p.selectedSubVariant ?? '—'),
    row('range',     p.selectedRange      ?? '—'),
    div('── cycle ──'),
    row('count',     count),
    row('threshold', threshold),
    row('armed',     armed),
    row('until fin', armed ? 'NEXT HIT' : `${until} hit${until === 1 ? '' : 's'}`),
    row('timeline',  timeline),
  ];

  if (p.cadenceSpeedStacks > 0 || 'cadence.speed-stack' in p.passives) {
    entries.push(row('speed stk', p.cadenceSpeedStacks));
  }

  const cadencePassives = Object.entries(p.passives).filter(([k]) => k.startsWith('cadence.'));
  if (cadencePassives.length > 0) {
    entries.push(div('── passives ──'));
    for (const [key, val] of cadencePassives) {
      entries.push(row(key.replace('cadence.', ''), val));
    }
  }

  return { id: 'cadence', label: 'CADENCE', entries };
}

function buildPlayerSection(p: DebugPlayer): DebugSection {
  const sinceAtk = p.lastAttackAt > 0 ? `${Date.now() - p.lastAttackAt}ms ago` : '—';
  return {
    id: 'player', label: 'PLAYER',
    entries: [
      row('archetype', p.combatArchetype ?? '—'),
      row('nodeId',    p.nodeId),
      row('auto',      p.auto),
      div('── combat ──'),
      row('attack',    p.attack),
      row('atkCD',     `${p.attackCooldown}ms`),
      row('style',     p.attackStyle),
      row('lastAtk',   sinceAtk),
      row('hp',        `${p.hp} / ${p.maxHp}`),
    ],
  };
}

// ── Reward multiplier ─────────────────────────────────────────────────────────
// Server-global scalar on essence, biome XP and catalyst progress, so a
// balance/playtest cycle can reach late content without farming it. The atom
// mirrors the server, which is the authority: pressing a preset only *asks*, and
// the displayed value updates when the server echoes the change back.

const REWARD_MULT_PRESETS = [1, 5, 10, 25, 100];

function RewardMultiplierSection() {
  const multiplier = useAtomValue(rewardMultiplierAtom);
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const trimmed = draft.trim();
    setDraft('');
    if (!trimmed) return;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;
    hudBus.requestSetRewardMultiplier(clampRewardMultiplier(parsed));
  }

  return (
    <div className="debug-section">
      <div className="debug-row">
        <span className="debug-key">rewards</span>
        <span className="debug-val">{multiplier}x</span>
      </div>
      <div className="debug-div">essence · biome xp · catalysts</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {REWARD_MULT_PRESETS.map(preset => (
          <button
            key={preset}
            className={`debug-btn${multiplier === preset ? ' active' : ''}`}
            style={{ flex: 1, letterSpacing: '0.04em' }}
            onClick={() => hudBus.requestSetRewardMultiplier(preset)}
          >
            {preset}x
          </button>
        ))}
      </div>
      <input
        className="debug-input"
        type="number"
        min={DEBUG_REWARD_MULT_MIN}
        max={DEBUG_REWARD_MULT_MAX}
        step="any"
        placeholder={`custom (${DEBUG_REWARD_MULT_MIN}-${DEBUG_REWARD_MULT_MAX}) ↵`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commitDraft();
        }}
        onBlur={commitDraft}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

function fmt(v: DebugValue): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
  return String(v);
}

export function DebugPanel() {
  const [open, setOpen] = useAtom(debugPanelOpenAtom);

  // Dev tooling only: the panel (reset/rename/live combat readouts) is hidden in
  // production builds, matching the server, which only registers debug:* handlers
  // when IS_DEV.
  if (!DEV_TOOLS_ENABLED) return null;

  return (
    <div className="debug-panel">
      <button className="debug-panel__toggle" onClick={() => setOpen(o => !o)}>
        <span className="debug-panel__title">DEBUG</span>
        <span className="debug-panel__chevron">{open ? '▼' : '▶'}</span>
      </button>
      {open && <DebugPanelContent />}
    </div>
  );
}

function DebugPanelContent() {
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [confirmReset, setConfirmReset] = useState(false);
  const [tacticalMode, setTacticalMode] = useState(false);
  useEffect(() => hudBus.subscribeTacticalView(setTacticalMode), []);
  const playerId = useAtomValue(playerIdAtom);
  const playerName = useAtomValue(playerNameAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const cadenceCount = useAtomValue(cadenceCountAtom);
  const cadenceThreshold = useAtomValue(cadenceThresholdAtom);
  const cadenceEmpoweredArmed = useAtomValue(cadenceEmpoweredArmedAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const cadenceSpeedStacks = useAtomValue(cadenceSpeedStacksAtom);
  const passives = useAtomValue(passivesAtom);
  const lastAttackAt = useAtomValue(lastAttackAtAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const auto = useAtomValue(autoAtom);
  const attack = useAtomValue(attackAtom);
  const attackCooldown = useAtomValue(attackCooldownAtom);
  const attackStyle = useAtomValue(attackStyleAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const player: DebugPlayer | null = playerId && nodeId ? {
    cadenceCount,
    cadenceThreshold,
    cadenceEmpoweredArmed,
    selectedSubVariant,
    selectedRange,
    cadenceSpeedStacks,
    passives,
    lastAttackAt,
    combatArchetype,
    nodeId,
    auto,
    attack,
    attackCooldown,
    attackStyle,
    hp,
    maxHp,
  } : null;

  const sections: DebugSection[] = [];
  if (player) {
    if (player.combatArchetype === 'cadence' && player.cadenceThreshold > 0) {
      sections.push(buildCadenceSection(player));
    }
    sections.push(buildPlayerSection(player));
  }

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const inTestRoom = player?.nodeId === TEST_ROOM_NODE_ID;

  return (
    <>
      {DEV_TOOLS_ENABLED && (
        <div className="debug-section">
          <button
            className="debug-btn"
            onClick={() => hudBus.requestEquipPhaseTester()}
          >
            EQUIP DEV LOADOUT (400 DMG + INVULN)
          </button>
        </div>
      )}

      {DEV_TOOLS_ENABLED && <RewardMultiplierSection />}

      {/* Moved out of the right rail: this draws attack ranges and hitboxes, which
          is a debugging overlay rather than a system the player navigates to. */}
      <div className="debug-section">
        <button
          className={`debug-btn${tacticalMode ? ' active' : ''}`}
          onClick={() => hudBus.toggleTacticalView()}
        >
          {tacticalMode ? 'HIDE TACTICAL MODE' : 'TACTICAL MODE'}
        </button>
      </div>

      {DEV_TOOLS_ENABLED && (
        <div className="debug-section">
          <button
            className={`debug-btn${inTestRoom ? ' active' : ''}`}
            onClick={() => {
              if (inTestRoom) hudBus.requestLeaveTestRoom();
              else            hudBus.requestGoToTestRoom();
            }}
          >
            {inTestRoom ? 'LEAVE TEST ROOM' : 'GO TO TEST ROOM'}
          </button>
        </div>
      )}

      <div className="debug-section">
        {!confirmReset ? (
          <button
            className="debug-btn"
            style={{ color: '#ff6666' }}
            onClick={() => setConfirmReset(true)}
          >
            RESET PROGRESS
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="debug-div" style={{ padding: '4px 0', color: '#ff9944' }}>
              Wipes skills, items, currencies &amp; all progression. Confirm?
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="debug-btn"
                style={{ flex: 1, color: '#ff4444' }}
                onClick={() => { hudBus.requestResetProgress(); setConfirmReset(false); }}
              >
                YES, RESET
              </button>
              <button
                className="debug-btn"
                style={{ flex: 1 }}
                onClick={() => setConfirmReset(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="debug-section">
        <button
          className="debug-btn"
          onClick={() => {
            const next = window.prompt('Rename character to:', playerName ?? '');
            if (next !== null && next.trim()) hudBus.requestRenameCharacter(next.trim());
          }}
        >
          RENAME CHARACTER
        </button>
      </div>

      {sections.map(section => (
        <div key={section.id} className="debug-section">
          <button className="debug-section__hdr" onClick={() => toggle(section.id)}>
            <span>{section.label}</span>
            <span className="debug-section__chevron">{collapsed.has(section.id) ? '▶' : '▼'}</span>
          </button>

          {!collapsed.has(section.id) && (
            <div className="debug-section__body">
              {section.entries.map((entry, i) =>
                entry.kind === 'divider' ? (
                  <div key={i} className="debug-div">{entry.label}</div>
                ) : (
                  <div key={i} className="debug-row">
                    <span className="debug-key">{entry.key}</span>
                    <span className="debug-val">{fmt(entry.value)}</span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}

      {!player && (
        <div className="debug-div" style={{ padding: '6px 0' }}>No player data</div>
      )}
    </>
  );
}
