import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { PlayerSnapshot, SubVariant } from '@mmo-idle/shared';
import { GAME_CONFIG, emptyEquipment } from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/components/player';
import { assemblePlayerSnapshot } from '../ecs/projection';
import { accounts, characters } from './schema';
import { recalculatePlayerStats } from '../systems/stats';
import { equipItemSnapshot } from '../systems/inventory';
import type * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

// ── Account ───────────────────────────────────────────────────────────────────

export function findOrCreateAccount(db: DB, accountId: string, displayName: string): void {
  const existing = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!existing) {
    db.insert(accounts).values({
      id:          accountId,
      displayName,
      discordId:   null,
      createdAt:   Date.now(),
    }).run();
  }
}

// ── Character ─────────────────────────────────────────────────────────────────

/**
 * Returns the first character for the account, or creates a fresh one.
 * `socketId` is set as the runtime `id` on the returned PlayerSnapshot — the DB row
 * keeps its own stable UUID so we can reload the same character next session.
 */
export function getOrCreateCharacter(
  db: DB,
  accountId: string,
  characterName: string,
  socketId: string,
): PlayerSnapshot {
  const row = db.select().from(characters)
    .where(eq(characters.accountId, accountId))
    .get();

  if (row) {
    return hydratePlayer(row, socketId);
  }

  const charId = randomUUID();
  const spawnX = GAME_CONFIG.NODE_WIDTH  / 2;
  const spawnY = GAME_CONFIG.NODE_HEIGHT / 2;

  db.insert(characters).values({
    id:                 charId,
    accountId,
    name:               characterName,
    nodeId:             'node-5-5',
    x:                  spawnX,
    y:                  spawnY,
    level:              0,
    skillPoints:        0,
    unlockedSkills:     '[]',
    inventory:          '["basic-sword"]',
    equipment:          JSON.stringify(emptyEquipment()),
    essences:           JSON.stringify({ red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }),
    biomeXP:            '{}',
    biomeLevel:         '{}',
    unlockedRecipes:    '[]',
    questProgress:      '{}',
    combatArchetype:    null,
    selectedClass:      null,
    selectedSubVariant: null,
    selectedRange:      null,
    currentSkillTier:   0,
    updatedAt:          Date.now(),
  }).run();

  const fresh = buildFreshPlayer(socketId, characterName, spawnX, spawnY);
  equipItemSnapshot(fresh, 'basic-sword');
  return fresh;
}

export function saveCharacter(db: DB, accountId: string, player: PlayerSnapshot): void {
  db.update(characters)
    .set({
      name:               player.name,
      nodeId:             player.nodeId,
      x:                  player.x,
      y:                  player.y,
      level:              player.level,
      skillPoints:        player.skillPoints,
      unlockedSkills:     JSON.stringify(player.unlockedSkills),
      inventory:          JSON.stringify(player.inventory),
      equipment:          JSON.stringify(player.equipment),
      essences:           JSON.stringify(player.essences),
      biomeXP:            JSON.stringify(player.biomeXP),
      biomeLevel:         JSON.stringify(player.biomeLevel),
      unlockedRecipes:    JSON.stringify(player.unlockedRecipes),
      questProgress:      JSON.stringify(player.questProgress),
      combatArchetype:    player.combatArchetype,
      selectedClass:      player.selectedClass,
      selectedSubVariant: player.selectedSubVariant,
      selectedRange:      player.selectedRange,
      currentSkillTier:   player.currentSkillTier,
      playerTier:         player.playerTier,
      updatedAt:          Date.now(),
    })
    .where(eq(characters.accountId, accountId))
    .run();
}

export function saveCharacterFromEntity(db: DB, accountId: string, entity: PlayerEntity): void {
  saveCharacter(db, accountId, assemblePlayerSnapshot(entity));
}

// ── Internals ─────────────────────────────────────────────────────────────────

type CharacterRow = typeof characters.$inferSelect;

function hydratePlayer(row: CharacterRow, socketId: string): PlayerSnapshot {
  const player = buildFreshPlayer(socketId, row.name, row.x, row.y);

  player.nodeId             = row.nodeId;
  player.level              = row.level;
  player.skillPoints        = row.skillPoints;
  player.unlockedSkills     = JSON.parse(row.unlockedSkills) as string[];
  player.inventory          = JSON.parse(row.inventory) as string[];
  player.equipment          = JSON.parse(row.equipment) as PlayerSnapshot['equipment'];
  player.essences           = JSON.parse(row.essences) as PlayerSnapshot['essences'];
  player.biomeXP            = JSON.parse(row.biomeXP) as PlayerSnapshot['biomeXP'];
  player.biomeLevel         = JSON.parse(row.biomeLevel) as PlayerSnapshot['biomeLevel'];
  player.unlockedRecipes    = JSON.parse(row.unlockedRecipes) as PlayerSnapshot['unlockedRecipes'];
  player.questProgress      = JSON.parse(row.questProgress) as PlayerSnapshot['questProgress'];
  player.combatArchetype    = (row.combatArchetype as PlayerSnapshot['combatArchetype']) ?? null;
  player.selectedClass      = row.selectedClass ?? null;
  player.selectedSubVariant = (row.selectedSubVariant as SubVariant | null) ?? null;
  player.selectedRange      = row.selectedRange ?? null;
  player.currentSkillTier   = row.currentSkillTier;
  player.playerTier         = row.playerTier;

  // Restore cadenceThreshold from the T1 skill node if unlocked
  const t1Node = player.unlockedSkills.find(s => s.endsWith('-light') || s.endsWith('-balanced') || s.endsWith('-heavy'));
  if (player.combatArchetype === 'cadence' && t1Node) {
    const thresholds: Record<string, number> = {
      'cadence-light': 4, 'cadence-balanced': 5, 'cadence-heavy': 6,
    };
    player.cadenceThreshold = thresholds[t1Node] ?? 0;
  }

  // Rebuild all derived stats from restored skills + equipment
  recalculatePlayerStats(player);

  // Always log in at full HP
  player.hp = player.maxHp;

  return player;
}

function buildFreshPlayer(id: string, name: string, x: number, y: number): PlayerSnapshot {
  return {
    id,
    name,
    x,
    y,
    targetX:              x,
    targetY:              y,
    hp:                   GAME_CONFIG.PLAYER_MAX_HP,
    maxHp:                GAME_CONFIG.PLAYER_MAX_HP,
    attack:               GAME_CONFIG.PLAYER_ATTACK,
    onHitDamage:          0,
    plating:              GAME_CONFIG.PLAYER_PLATING,
    damageReduction:      0,
    evasion:              0,
    evasionCount:         0,
    shields:              [],
    attackRange:          GAME_CONFIG.PLAYER_ATTACK_RANGE,
    attackCooldown:       GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
    lastAttackAt:         0,
    attackTargetId:       null,
    auto:                 false,
    nodeId:               'node-5-5',
    essences:             { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    level:                0,
    skillPoints:          0,
    unlockedSkills:       [],
    passives:             {},
    cadenceSpeedStacks:   0,
    currentSkillTier:     0,
    hpRegen:              GAME_CONFIG.PLAYER_HP_REGEN,
    speed:                GAME_CONFIG.PLAYER_SPEED,
    attackStyle:          'slash',
    inventory:            ['basic-sword'],
    equipment:            emptyEquipment(),
    biomeXP:              {},
    biomeLevel:           {},
    unlockedRecipes:      [],
    combatArchetype:      null,
    selectedClass:        null,
    selectedSubVariant:   null,
    selectedRange:        null,
    cadenceCount:         0,
    cadenceThreshold:     0,
    cadenceEmpoweredArmed: false,
    ammoCount:            0,
    ammoMax:              0,
    heatPct:              0,
    laserOverheated:      false,
    executionReady:       false,
    executionCooldownPct: 0,
    energyCount:          0,
    empoweredReady:       false,
    targetDotStacks:      0,
    targetChillStacks:    0,
    sacredBuffActive:     false,
    sacredBuffPct:        0,
    isChanneling:         false,
    channelingPct:        0,
    activeBuffs:          [],
    questProgress:        {},
    playerTier:           0,
  };
}
