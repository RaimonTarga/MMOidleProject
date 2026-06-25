import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  DEFAULT_RUNE_LOADOUT,
  RUNE_RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  getRuleName,
  isRuneRecipeAvailableForArchetype,
  isRuneRecipeUnlocked,
  isRuneRuleCompatibleForArchetype,
  runeBudgetForGlobalMastery,
  runeChannelLabel,
  runeLoadoutCost,
  runeRuleCost,
  type ActionDef,
  type ConditionDef,
  type EquippedRule,
  type EssenceType,
  type RuneRecipe,
} from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import {
  bossesClearedAtom,
  combatArchetypeAtom,
  essencesAtom,
  playerNodeIdAtom,
  globalMasteryAtom,
  biomeLevelAtom,
  runePanelTabAtom,
  runeRecipesCraftedAtom,
  runesEquippedAtom,
  runesOwnedAtom,
} from '../hud/atoms';
import { CostDisplay, EssenceSummary } from './crafting/shared';
import { biomeName } from './crafting/common';
import './crafting.css';
import './skillTree.css';

interface Props {
  onClose: () => void;
}

const CHANNEL_COLOR: Record<string, string> = {
  MOVEMENT: '#ffb36b',
  TARGETING: '#d6a8ff',
  OOC_MAINTENANCE: '#7ab8ff',
  RESOURCE_MAINTENANCE: '#73d7ff',
  GLOBAL_STRATEGY: '#7affc0',
  CONTROL: '#ff7a9a',
  TECHNIQUE: '#ffd76b',
  GUARD: '#9ad0ff',
  STANCE: '#c0ff9a',
};

function ruleLabel(rule: EquippedRule): { title: string; subtitle: string } {
  const named = getRuleName(rule.conditionId, rule.actionId);
  const cond = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  const fallback = `${cond?.name ?? rule.conditionId} -> ${action?.name ?? rule.actionId}`;
  return {
    title: named?.name ?? fallback,
    subtitle: named?.blurb ?? fallback,
  };
}

function rpBadge(cost: number, tone: 'normal' | 'danger' = 'normal') {
  return (
    <span
      style={{
        minWidth: 34,
        height: 28,
        padding: '0 6px',
        border: `1px solid ${tone === 'danger' ? '#ff7a7a' : '#e0c15c'}`,
        borderRadius: 3,
        background: tone === 'danger' ? 'rgba(90, 20, 30, 0.75)' : 'rgba(65, 47, 12, 0.85)',
        color: tone === 'danger' ? '#ffc0c0' : '#ffe084',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 'bold',
        flexShrink: 0,
      }}
    >
      {cost} RP
    </span>
  );
}

function RunePointMeter({ spent, budget }: { spent: number; budget: number }) {
  const over = Math.max(0, spent - budget);
  return (
    <div
      style={{
        border: '1px solid rgba(100, 85, 200, 0.25)',
        borderRadius: 6,
        padding: '9px 10px',
        background: 'rgba(13, 11, 34, 0.7)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            color: '#c0aee8',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Rune Points
        </span>
        <span style={{ color: over > 0 ? '#ff7a7a' : '#ffe084', fontSize: 12, fontWeight: 'bold' }}>
          {spent} / {budget}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: budget }, (_, i) => {
          const used = i < Math.min(spent, budget);
          return (
            <span
              key={i}
              title={used ? 'Spent rune point' : 'Available rune point'}
              style={{
                width: 18,
                height: 10,
                borderRadius: 2,
                border: `1px solid ${used ? '#e0c15c' : '#46d8a4'}`,
                background: used ? 'rgba(224, 193, 92, 0.9)' : 'rgba(70, 216, 164, 0.18)',
                boxShadow: used ? '0 0 8px rgba(224, 193, 92, 0.22)' : 'none',
              }}
            />
          );
        })}
        {Array.from({ length: over }, (_, i) => (
          <span
            key={`over-${i}`}
            title="Over budget"
            style={{
              width: 18,
              height: 10,
              borderRadius: 2,
              border: '1px solid #ff7a7a',
              background: 'rgba(255, 122, 122, 0.85)',
              boxShadow: '0 0 8px rgba(255, 122, 122, 0.28)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function RunesPanel({ onClose }: Props) {
  const owned = useAtomValue(runesOwnedAtom);
  const equipped = useAtomValue(runesEquippedAtom);
  const gm = useAtomValue(globalMasteryAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);

  const [tab, setTab] = useAtom(runePanelTabAtom);
  const [loadout, setLoadout] = useState<EquippedRule[]>(equipped);
  const [selCond, setSelCond] = useState<string | null>(null);
  const [selAction, setSelAction] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setLoadout(equipped);
  }, [equipped]);

  const ownedSet = new Set(owned);
  const conditions: ConditionDef[] = [...CONDITION_DATABASE.values()].filter((c) =>
    ownedSet.has(c.id),
  );
  const actions: ActionDef[] = [...ACTION_DATABASE.values()].filter((a) =>
    ownedSet.has(a.id),
  );
  const viableActions = selCond
    ? actions.filter((a) =>
        isRuneRuleCompatibleForArchetype(
          { conditionId: selCond, actionId: a.id },
          combatArchetype,
        ),
      )
    : [];

  const pendingRule =
    selCond && selAction ? { conditionId: selCond, actionId: selAction } : null;
  const pendingCompatible = pendingRule
    ? isRuneRuleCompatibleForArchetype(pendingRule, combatArchetype)
    : false;
  const pendingCost = pendingRule ? runeRuleCost(pendingRule) : 0;
  const budget = runeBudgetForGlobalMastery(gm);
  const spent = runeLoadoutCost(loadout);
  const pendingOverBudget = pendingRule
    ? spent + pendingCost > budget
    : false;

  function commit(next: EquippedRule[]): void {
    setLoadout(next);
    hudBus.requestSetRuneLoadout(next);
  }

  function addRule(): void {
    if (!pendingRule || !pendingCompatible || pendingOverBudget) return;
    commit([...loadout, pendingRule]);
  }

  function removeRule(index: number): void {
    commit(loadout.filter((_, i) => i !== index));
  }

  function moveRule(index: number, offset: -1 | 1): void {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= loadout.length) return;
    const next = [...loadout];
    const [rule] = next.splice(index, 1);
    next.splice(nextIndex, 0, rule);
    commit(next);
  }

  function resetDefaultLoadout(): void {
    commit(DEFAULT_RUNE_LOADOUT.map((rule) => ({ ...rule })));
    setSelCond(null);
    setSelAction(null);
    setConfirmReset(false);
  }

  const preview =
    selCond && selAction ? getRuleName(selCond, selAction) : null;
  const previewCond = selCond ? CONDITION_DATABASE.get(selCond) : null;
  const previewAction = selAction ? ACTION_DATABASE.get(selAction) : null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 820, position: 'relative' }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Runes</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="craft-tabs" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`craft-tab${tab === 'loadout' ? ' craft-tab--active' : ''}`}
            onClick={() => setTab('loadout')}
          >
            Loadout
          </button>
          <button
            type="button"
            className={`craft-tab${tab === 'forge' ? ' craft-tab--active' : ''}`}
            onClick={() => setTab('forge')}
          >
            Forge
          </button>
        </div>

        <div className="skill-tree-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'loadout' ? (
            <>
              <RunePointMeter spent={spent} budget={budget} />

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  color: '#c0aee8',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Priority rules {loadout.length > 0 ? `(${loadout.length})` : ''}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="auto-btn"
                  onClick={() => setConfirmReset(true)}
                  style={{
                    width: 'auto',
                    minHeight: 24,
                    padding: '4px 10px',
                    fontSize: 10,
                  }}
                >
                  RESET DEFAULT
                </button>
              </div>
            </div>
            {loadout.length === 0 ? (
              <div style={{ color: '#6868a8', fontSize: 12, fontStyle: 'italic' }}>
                No rules equipped. Your character will only use the fallback combat behavior.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadout.map((rule, i) => {
                  const { title, subtitle } = ruleLabel(rule);
                  const action = ACTION_DATABASE.get(rule.actionId);
                  const accent = action ? CHANNEL_COLOR[action.channel] : '#7a7ad0';
                  const compatible = isRuneRuleCompatibleForArchetype(rule, combatArchetype);
                  return (
                    <div
                      key={`${rule.conditionId}:${rule.actionId}:${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        border: `1px solid ${compatible ? 'rgba(100, 85, 200, 0.22)' : 'rgba(255, 122, 122, 0.5)'}`,
                        borderLeft: `4px solid ${compatible ? accent : '#ff7a7a'}`,
                        borderRadius: 5,
                        padding: '8px 10px',
                        background: 'rgba(13, 11, 34, 0.7)',
                      }}
                    >
                      <span style={{ color: '#6868a8', fontSize: 11, width: 18 }}>{i + 1}</span>
                      {rpBadge(runeRuleCost(rule), compatible ? 'normal' : 'danger')}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#d8caf5', fontWeight: 'bold', fontSize: 13 }}>{title}</div>
                        <div style={{ color: compatible ? '#8888b0' : '#ffaaa0', fontSize: 11, marginTop: 2 }}>
                          {compatible ? subtitle : 'Invalid pairing. Remove or replace this rule.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <PriorityButton
                          label="Move rule higher"
                          disabled={i === 0}
                          onClick={() => moveRule(i, -1)}
                        >
                          ↑
                        </PriorityButton>
                        <PriorityButton
                          label="Move rule lower"
                          disabled={i === loadout.length - 1}
                          onClick={() => moveRule(i, 1)}
                        >
                          ↓
                        </PriorityButton>
                      </div>
                      <button
                        className="skill-tree-close"
                        onClick={() => removeRule(i)}
                        title="Remove rule"
                      >
                        x
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Column<ConditionDef>
              heading="Situation"
              items={conditions}
              selectedId={selCond}
              onSelect={(id) => {
                setSelCond(id);
                if (
                  selAction &&
                  !isRuneRuleCompatibleForArchetype(
                    { conditionId: id, actionId: selAction },
                    combatArchetype,
                  )
                ) {
                  setSelAction(null);
                }
              }}
              costFor={(c) => c.cost}
              renderMeta={(c) => c.blurb}
            />
            <div style={{ alignSelf: 'center', color: '#6868a8', fontSize: 20 }}>then</div>
            <Column<ActionDef>
              heading="Response"
              items={viableActions}
              selectedId={selAction}
              onSelect={setSelAction}
              costFor={(a) => a.cost}
              accentFor={(a) => CHANNEL_COLOR[a.channel]}
              emptyText={selCond ? 'No responses fit this situation.' : 'Pick a situation first.'}
              renderMeta={(a) => `${runeChannelLabel(a.channel)} - ${a.blurb}`}
            />
          </div>

          <div
            style={{
              border: '1px solid rgba(100, 85, 200, 0.25)',
              borderRadius: 6,
              padding: '10px 12px',
              background: 'rgba(20, 16, 45, 0.5)',
            }}
          >
            {selCond && selAction ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {rpBadge(pendingCost, pendingOverBudget ? 'danger' : 'normal')}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#c0aee8', fontWeight: 'bold', fontSize: 14 }}>
                    {preview?.name ??
                      `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
                  </div>
                  <div style={{ color: pendingCompatible ? '#8888b0' : '#ffaaa0', fontSize: 11, marginTop: 3 }}>
                    {!pendingCompatible
                      ? 'That response does not make sense for this situation.'
                      : pendingOverBudget
                        ? 'This rule exceeds your current rune point budget.'
                        : preview?.blurb ??
                          `${previewCond?.name ?? selCond} -> ${previewAction?.name ?? selAction}`}
                  </div>
                </div>
                <button
                  className="auto-btn"
                  style={{ width: 'auto', padding: '6px 14px' }}
                  onClick={addRule}
                  disabled={!pendingCompatible || pendingOverBudget}
                >
                  ADD RULE
                </button>
              </div>
            ) : (
              <div style={{ color: '#6868a8', fontSize: 12 }}>
                Pick a situation and a response.
              </div>
            )}
          </div>

            </>
          ) : (
            <RuneForgeTab budget={budget} />
          )}
        </div>
        {confirmReset && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(4, 3, 12, 0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: 'min(420px, 100%)',
                border: '1px solid rgba(224, 193, 92, 0.42)',
                borderRadius: 6,
                background: 'rgba(13, 11, 34, 0.96)',
                boxShadow: '0 16px 60px rgba(0, 0, 0, 0.55)',
                padding: 16,
              }}
            >
              <div style={{ color: '#ffe084', fontWeight: 'bold', fontSize: 15 }}>
                Reset Rune Loadout
              </div>
              <div style={{ color: '#b8a8e0', fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>
                Restore the basic enemy-seeking setup? This replaces your current priority rules.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="auto-btn"
                  onClick={() => setConfirmReset(false)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="auto-btn active"
                  onClick={resetDefaultLoadout}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function canAffordRecipe(
  recipe: RuneRecipe,
  essences: Record<EssenceType, number>,
): boolean {
  return (Object.entries(recipe.cost) as [EssenceType, number][]).every(
    ([type, amount]) => (essences[type] ?? 0) >= amount,
  );
}

function recipeRuneLabel(recipe: RuneRecipe): string {
  if (!recipe.runeId) return 'Rune';
  return (
    CONDITION_DATABASE.get(recipe.runeId)?.name ??
    ACTION_DATABASE.get(recipe.runeId)?.name ??
    recipe.runeId
  );
}

function recipeTypeLabel(recipe: RuneRecipe): string {
  return recipe.runeKind === 'condition' ? 'Situation' : 'Response';
}

/** Player-facing "how to unlock" label: biome-mastery gate, else boss gate, else free. */
function recipeRequirementLabel(recipe: RuneRecipe): string {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
    return `Reach ${biomeName(recipe.recipeGroup)} Lv ${recipe.requiredBiomeLevel}`;
  }
  if (recipe.requiredBossClear) {
    const [group, tier] = recipe.requiredBossClear.split(':');
    if (group && tier) return `Defeat ${biomeName(group)} T${tier} boss`;
    return recipe.requiredBossClear;
  }
  return 'Unlocked';
}

function RuneForgeTab({
  budget,
}: {
  budget: number;
}) {
  const nodeId = useAtomValue(playerNodeIdAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const essences = useAtomValue(essencesAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const craftedRecipeIds = useAtomValue(runeRecipesCraftedAtom);
  const ownedRuneIds = useAtomValue(runesOwnedAtom);
  const [craftResult, setCraftResult] = useState<{
    recipeId: string;
    success: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      const result = (e as CustomEvent<{
        recipeId: string;
        success: boolean;
        reason?: string;
      }>).detail;
      if (timer) clearTimeout(timer);
      setCraftResult(result);
      timer = setTimeout(() => setCraftResult(null), 2200);
    };
    window.addEventListener('hud:runeCraftResult', handler);
    return () => {
      window.removeEventListener('hud:runeCraftResult', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
  const craftedSet = useMemo(() => new Set(craftedRecipeIds), [craftedRecipeIds]);
  const ownedSet = useMemo(() => new Set(ownedRuneIds), [ownedRuneIds]);

  const visibleRecipes = useMemo(() => {
    return [...RUNE_RECIPE_DATABASE.values()]
      .filter((recipe) =>
        isRuneRecipeAvailableForArchetype(recipe, combatArchetype),
      )
      .sort((a, b) => {
        const unlocked = (recipe: RuneRecipe) => {
          if (craftedSet.has(recipe.id)) return true;
          return recipe.runeId !== undefined && ownedSet.has(recipe.runeId);
        };
        const unlockedDelta = Number(unlocked(a)) - Number(unlocked(b));
        if (unlockedDelta !== 0) return unlockedDelta;
        return (
          a.tier - b.tier ||
          recipeTypeLabel(a).localeCompare(recipeTypeLabel(b)) ||
          a.name.localeCompare(b.name)
        );
      });
  }, [combatArchetype, craftedSet, ownedSet]);

  return (
    <div className="craft-body" style={{ padding: 0 }}>
      <EssenceSummary essences={essences} />
      <div
        style={{
          border: '1px solid rgba(100, 85, 200, 0.25)',
          borderRadius: 6,
          padding: '9px 10px',
          background: 'rgba(13, 11, 34, 0.7)',
          color: '#c0aee8',
          fontSize: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span>Rune Points</span>
        <strong style={{ color: '#ffe084' }}>{budget} max</strong>
      </div>

      {visibleRecipes.length === 0 ? (
        <div className="craft-empty">No rune recipes available for this class.</div>
      ) : (
        <div className="craft-list">
          {visibleRecipes.map((recipe) => {
            const crafted = craftedSet.has(recipe.id);
            const alreadyOwned =
              recipe.runeId !== undefined && ownedSet.has(recipe.runeId);
            const locked =
              !isTestRoom &&
              !isRuneRecipeUnlocked(recipe, { biomeLevel, bossesCleared });
            const canAfford = isTestRoom || canAffordRecipe(recipe, essences);
            const canCraft = !crafted && !alreadyOwned && !locked && canAfford;
            const result = craftResult?.recipeId === recipe.id ? craftResult : null;
            const accent =
              recipe.runeKind === 'condition' ? '#7ab8ff' : '#7affc0';

            return (
              <div
                key={recipe.id}
                className={[
                  'craft-recipe',
                  crafted || alreadyOwned ? 'craft-recipe--owned' : '',
                  locked ? 'craft-recipe--locked' : '',
                  !crafted && !alreadyOwned && !locked && !canAfford ? 'craft-recipe--unaffordable' : '',
                ].filter(Boolean).join(' ')}
              >
                {result && (
                  <div className={`craft-card-result craft-card-result--${result.success ? 'ok' : 'err'}`}>
                    <span className="craft-card-result__icon">{result.success ? '+' : 'x'}</span>
                    <span className="craft-card-result__text">
                      {result.success ? 'Forged!' : result.reason ?? 'Could not forge'}
                    </span>
                  </div>
                )}

                <div
                  className="craft-recipe__icon"
                  style={{
                    borderColor: `${accent}77`,
                    background: `${accent}14`,
                    color: accent,
                    fontSize: 18,
                  }}
                >
                  {recipe.runeKind === 'condition' ? '?' : '>'}
                </div>

                <div className="craft-recipe__content">
                  <div className="craft-recipe__header">
                    <span className="craft-recipe__name">{recipe.name}</span>
                    <span className="craft-recipe__tier-badge">T{recipe.tier}</span>
                    <span className="craft-recipe__owned-badge" style={{ color: accent }}>
                      {recipeTypeLabel(recipe)}
                    </span>
                    {locked && (
                      <span className="craft-recipe__source">LOCKED</span>
                    )}
                    {(crafted || alreadyOwned) && (
                      <span className="craft-recipe__owned-badge">UNLOCKED</span>
                    )}
                  </div>

                  <div className="craft-recipe__stats">
                    <span className="craft-stat-pill">
                      <span className="craft-stat-pill__value">{recipeRuneLabel(recipe)}</span>
                      <span className="craft-stat-pill__label">Unlock</span>
                    </span>
                  </div>

                  <ul className="craft-recipe__effects">
                    <li className="craft-recipe__effect-line">{recipe.description}</li>
                  </ul>

                  <CostDisplay cost={recipe.cost} essences={essences} />

                  <div className="craft-recipe__footer">
                    <span
                      className={`craft-recipe__desc${locked ? ' craft-recipe__locked-label' : ''}`}
                    >
                      {crafted || alreadyOwned
                        ? 'Unlocked'
                        : recipeRequirementLabel(recipe)}
                    </span>
                    <button
                      className="craft-recipe__btn"
                      disabled={!canCraft}
                      onClick={() => hudBus.requestCraftRuneRecipe(recipe.id)}
                    >
                      {crafted || alreadyOwned
                        ? 'Unlocked'
                        : locked
                          ? 'Locked'
                          : canAfford ? 'Forge' : 'Insufficient'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriorityButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24,
        height: 20,
        borderRadius: 3,
        border: `1px solid ${disabled ? 'rgba(100, 85, 200, 0.16)' : 'rgba(122, 184, 255, 0.48)'}`,
        background: disabled ? 'rgba(13, 11, 34, 0.35)' : 'rgba(24, 31, 62, 0.9)',
        color: disabled ? '#4a466f' : '#bcd8ff',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function Column<T extends { id: string; name: string }>({
  heading,
  items,
  selectedId,
  onSelect,
  accentFor,
  costFor,
  emptyText,
  renderMeta,
}: {
  heading: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  accentFor?: (item: T) => string | undefined;
  costFor: (item: T) => number;
  emptyText?: string;
  renderMeta?: (item: T) => string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          color: '#c0aee8',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {heading}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0 && (
          <div style={{ color: '#6868a8', fontSize: 12, padding: '8px 2px' }}>
            {emptyText ?? 'Nothing available.'}
          </div>
        )}
        {items.map((item) => {
          const selected = item.id === selectedId;
          const accent = accentFor?.(item) ?? '#7a7ad0';
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                border: `1px solid ${selected ? accent : 'rgba(100, 85, 200, 0.22)'}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: 5,
                padding: '8px 10px',
                background: selected ? 'rgba(40, 30, 80, 0.8)' : 'rgba(13, 11, 34, 0.7)',
                color: selected ? '#fff' : '#b8a8e0',
                cursor: 'pointer',
                fontFamily: 'monospace',
                boxShadow: selected ? `0 0 0 1px ${accent}` : 'none',
              }}
            >
              {rpBadge(costFor(item))}
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 'bold', fontSize: 13 }}>{item.name}</span>
                {renderMeta && (
                  <span style={{ display: 'block', color: '#8888b0', fontSize: 10, marginTop: 2 }}>
                    {renderMeta(item)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
