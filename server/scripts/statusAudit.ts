/**
 * Static status registry audit — the library. Reads source only: no game
 * bootstrap, databases, writes or network access.
 *
 * It parses the server systems, the complete shared source set and the client's
 * six status tables with the installed TypeScript checker, extracts every status
 * id a writer can apply (resolving constants, configuration objects and the known
 * dynamic seams), and checks each against the client registry: a player tile, a
 * target label, help, badge colour and an icon. `gaps` is what is missing;
 * `accepted` is what was reviewed and accepted, each with its reason.
 *
 * Two consumers: `_statusAudit.ts` (the CLI that prints the report in
 * docs/briefs/status-registry-audit-2026-10-05.md) and
 * `server/test/statusRegistry.test.ts`, which pins zero gaps so a new status id
 * without its label, help, badge or icon fails CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { isTargetHiddenStatusId } from '@mmo-idle/shared';

/**
 * Gaps that were reviewed and ACCEPTED, each with its reason. Keyed by
 * `<id>: <issue>` exactly as the gap reads, so an acceptance covers that one issue
 * and nothing else: if the same id later loses its target copy too, that is a new
 * gap. An acceptance that no longer matches a gap is itself reported (stale).
 */
export const ACCEPTED_GAPS: Readonly<Record<string, string>> = {
  'kata-release: player: no tile/projection':
    'An internal latch: the Kata stack is spent, and the next Technique reads it. The Kata tile already shows the stacks the player builds.',
  'kata-release: no authored icon lookup':
    'Never drawn (see above): an internal latch needs no icon.',
  'stun-immune: player: no tile/projection':
    'The post-stun ward. The Stunned tile is the hard control the player answers; a second tile for the ward that follows it would be HUD noise (design §26.4: the HUD may not be dense). Its target-side badge and copy exist.',
  'icon key defense-hardening-maxdr: icon registry entry has no descriptor, runtime-id or alias consumer':
    'Authored art kept in the registry for the Hardening family; no status uses it today. Not a status id.',
  'icon key summoner-howl-banner: icon registry entry has no descriptor, runtime-id or alias consumer':
    'Kept on purpose as a Summoner icon (docs/conduit-current-state.md §9). Not a status id.',
  'cooldown-temporal-ext: descriptor requires unproduced status: temporal-extension-buff (server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:76)':
    "The Cooldown path's Temporal Extension tile reads a buff nothing writes, and its passive (`cooldown.temporal-extension`) has no reader either: the mechanic itself is unimplemented. A class-path question for the designer, not a registry one; the tile stays authored for when it ships.",
  'ability-entangled: authored label/help/badge; no status writer or descriptor found':
    'Its writer was an ability keystone, removed with the ability node rows (class-first rework D1). The status and its copy stay with the abilities until task D3 removes them.',
  'ability-immunity: descriptor requires unproduced status: ability-immunity (server/src/systems/player/abilities/abilityBuffs.ts:208)':
    "Cleanse's Immunity keystone wrote it and went with the ability node rows (class-first rework D1). The tile and the admission gate that reads it are guard plumbing, kept until task D3.",
};

/** One open (or accepted) registry gap: which id, and what it lacks. */
export interface AuditGap {
  /** The id, or `icon key <id>` / `boss channel <id>` for the two non-status namespaces. */
  key: string;
  issue: string;
}

/** Repository root, from this file's own location. */
export const AUDIT_DEFAULT_ROOT = path.resolve(__dirname, '..', '..');

export function auditStatusRegistry(root: string = AUDIT_DEFAULT_ROOT) {
  const slash = (value: string) => value.replace(/\\/g, '/');
  function walk(dir: string): string[] {
    return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
      const file = `${dir}/${entry.name}`;
      return entry.isDirectory() ? walk(file) : /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) ? [file] : [];
    }).sort();
  }
  if (!fs.existsSync(path.join(root, 'CLAUDE.md')) || !fs.existsSync(path.join(root, 'server/src/systems'))) {
    throw new Error('Run this script from the MMO Idle repository root.');
  }
  const files = [...walk('server/src/systems'), ...walk('shared/src'),
    'client/src/hud/statusHelp.ts', 'client/src/hud/targetStatusMeta.ts',
    'client/src/hud/BuffBar.tsx', 'client/src/hud/buffTransitions.ts',
    'client/src/ui/conceptIcons.ts', 'client/src/hud/statusTooltips.ts'];
  const program = ts.createProgram(files.map((file) => path.join(root, file)), {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const source = (file: string) => program.getSourceFile(path.join(root, file))!;
  const loc = (node: ts.Node) => `${slash(path.relative(root, node.getSourceFile().fileName))}:${node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
  function visit(node: ts.Node, callback: (node: ts.Node) => void): void {
    callback(node); node.forEachChild((child) => visit(child, callback));
  }
  function unwrap(node: ts.Node): ts.Node {
    return ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)
      || ts.isNonNullExpression(node) ? unwrap(node.expression) : node;
  }
  function declaration(node: ts.Node): ts.Node | undefined {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol?.valueDeclaration ?? symbol?.declarations?.[0];
  }
  function resolveNode(input: ts.Node, seen = new Set<ts.Node>()): ts.Node {
    const node = unwrap(input);
    if (seen.has(node)) return node;
    seen.add(node);
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
      const decl = declaration(ts.isPropertyAccessExpression(node) ? node.name : node);
      if (decl && (ts.isVariableDeclaration(decl) || ts.isPropertyAssignment(decl)) && decl.initializer) {
        return resolveNode(decl.initializer, seen);
      }
    }
    if (ts.isCallExpression(node) && /^(scaleMechanicEffectConfig|scalePlayerDebuffConfig|playerDebuffConfig)$/.test(node.expression.getText())) {
      return resolveNode(node.arguments[node.expression.getText() === 'playerDebuffConfig' ? 1 : 0], seen);
    }
    return node;
  }
  function strings(input: ts.Node | undefined, seen = new Set<ts.Node>()): string[] {
    if (!input || seen.has(input)) return [];
    seen.add(input);
    const node = resolveNode(input);
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (ts.isConditionalExpression(node)) return [...strings(node.whenTrue, seen), ...strings(node.whenFalse, seen)];
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)) {
      return [...strings(node.left, seen), ...strings(node.right, seen)];
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap((e) => strings(e, seen));
    if (ts.isNewExpression(node) && node.arguments?.[0]) return strings(node.arguments[0], seen);
    if (ts.isTemplateExpression(node)) {
      let values = [node.head.text];
      for (const span of node.templateSpans) {
        const tails = strings(span.expression, seen);
        if (!tails.length) return [];
        values = values.flatMap((head) => tails.map((tail) => head + tail + span.literal.text));
      }
      return values;
    }
    if (ts.isElementAccessExpression(node)) {
      const base = resolveNode(node.expression);
      const key = strings(node.argumentExpression)[0];
      if (ts.isObjectLiteralExpression(base) && key) return strings(prop(base, key), seen);
      if (ts.isArrayLiteralExpression(base) && ts.isNumericLiteral(node.argumentExpression)) return strings(base.elements[Number(node.argumentExpression.text)], seen);
    }
    return [];
  }
  function prop(input: ts.Node, key: string): ts.Node | undefined {
    const node = resolveNode(input);
    if (!ts.isObjectLiteralExpression(node)) return undefined;
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p) && p.name.getText().replace(/^['"]|['"]$/g, '') === key) return p.initializer;
      if (ts.isShorthandPropertyAssignment(p) && p.name.text === key) {
        const symbol = checker.getShorthandAssignmentValueSymbol(p);
        const decl = symbol?.valueDeclaration;
        return decl && ts.isVariableDeclaration(decl) ? decl.initializer : p.name;
      }
    }
    for (const p of node.properties) if (ts.isSpreadAssignment(p)) {
      const value = prop(p.expression, key); if (value) return value;
    }
    return undefined;
  }
  type Application = { id: string; at: string; carrier: string; totalMs: string; via: string };
  type Dynamic = { at: string; expression: string; target: string; config: string };
  const applications: Application[] = [];
  const dynamic: Dynamic[] = [];
  const descriptors = new Map<string, { at: string; reads: string[]; icon: string; text: string }>();
  const APIs = new Map([
    ['applyStatusEffect', [0, 1]], ['applyPlayerDebuff', [1, 2]],
    ['applyPlayerMechanicBuff', [1, 2]], ['applyResistedPlayerDebuff', [0, 1]],
    ['applySharedDebuffMaxWins', [1, 2]],
    // The monster rider table's writer (`monsterRiders.ts`): its target is the adapter,
    // a player or a summon, so the call carries no target argument.
    ['target.apply', [-1, 0]],
  ]);
  function carrier(target: string, file: string, api: string): string {
    if (api === 'applyResistedPlayerDebuff') return 'player';
    // It reaches players and summons; summons show no statuses yet (the Conduit HUD
    // decides), so the player tiles are the ones it needs.
    if (api === 'target.apply') return 'player';
    if (api === 'applyPlayerDebuff' || api === 'applySharedDebuffMaxWins') return 'monster';
    if (/monster|defender|targetState/.test(target)) return 'monster';
    if (/player|owner|attacker|wielder/.test(target)) return 'player';
    if (file.includes('/dot/t3/paths/')) return 'monster';
    if (file.includes('/player/') || file.includes('/mobility/') || /\/cooldown\/|\/energy\//.test(file)) return 'player';
    return '?';
  }
  function inferredCarrier(node: ts.Node, fallback: string): string {
    const expression = ts.isPropertyAccessExpression(node) ? node.expression : node;
    const type = checker.typeToString(checker.getTypeAtLocation(expression));
    return /PlayerEntity/.test(type) ? 'player' : /MonsterEntity/.test(type) ? 'monster' : fallback;
  }
  function readsFrom(input: ts.Node, seen = new Set<ts.Node>()): string[] {
    if (seen.has(input)) return [];
    seen.add(input);
    const out: string[] = [];
    visit(input, (node) => {
      if (!ts.isCallExpression(node)) return;
      if (/^(getStatusEffect|getStatusEffects|hasStatusEffect)$/.test(node.expression.getText())) out.push(...strings(node.arguments[1]));
      else {
        const decl = declaration(node.expression);
        if (decl && ts.isFunctionDeclaration(decl) && decl.body && loc(decl).startsWith('server/src/systems/')) out.push(...readsFrom(decl.body, seen));
      }
    });
    return out;
  }
  for (const file of files.filter((f) => f.startsWith('server/src/systems'))) visit(source(file), (node) => {
    if (!ts.isCallExpression(node)) return;
    const api = node.expression.getText();
    // The slow/root appliers take an optional effect id (design §26.2: the Control
    // lean's Hobbled and the Control payload's Pinned); without one, Hamstring's
    // and Binding Strike's.
    if (api === 'applyMonsterSlow') for (const id of node.arguments[5] ? strings(node.arguments[5]) : ['ability-slowed']) add(id, `server/src/systems/combat/status/monsterControl.ts:66; ${loc(node)}`, 'monster');
    if (api === 'applyMonsterRoot') for (const id of node.arguments[4] ? strings(node.arguments[4]) : ['ability-rooted']) add(id, `server/src/systems/combat/status/monsterControl.ts:98; ${loc(node)}`, 'monster');
    if (api === 'applyStun') {
      const target = node.arguments[0];
      const who = inferredCarrier(target, /combat\/engine\/(combat|patternCombat)\.ts/.test(file) ? 'both' : 'monster');
      add('stunned', `server/src/systems/combat/status/stun.ts:57; ${loc(node)}`, who);
      add('stun-immune', `server/src/systems/combat/status/stun.ts:65; ${loc(node)}`, who, 'no');
    }
    if (api === 'applyClassDotStack') add('dot', `server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; ${loc(node)}`, 'monster', 'no');
    // The Striker's bleed records (Rend, Festering Cut's rot): the id is the fourth argument.
    if (api === 'applyBleed') for (const id of strings(node.arguments[3])) add(id, loc(node), 'monster', 'no');
    const indexes = APIs.get(api);
    if (indexes) {
      const cfg = node.arguments[indexes[1]], target = node.arguments[indexes[0]]?.getText() ?? '';
      const idNode = cfg ? prop(cfg, 'id') : undefined;
      const ids = strings(idNode);
      if (!ids.length) dynamic.push({ at: loc(node), expression: idNode?.getText() ?? api, target, config: cfg?.getText().replace(/\s+/g, ' ').slice(0, 180) ?? '' });
      const targetNode = node.arguments[indexes[0]];
      for (const id of ids) applications.push({ id, at: loc(node), carrier: targetNode ? inferredCarrier(targetNode, carrier(target, file, api)) : carrier(target, file, api),
        totalMs: cfg && prop(cfg, 'data')?.getText().includes('totalMs') ? 'yes' : 'no', via: api });
    }
    if (api === 'defineBuff') {
      const id = strings(node.arguments[0])[0];
      if (!id) return;
      const reads = readsFrom(node.arguments[1]);
      descriptors.set(id, { at: loc(node), reads: [...new Set(reads)], icon: strings(prop(node.arguments[2], 'iconKey'))[0] ?? id, text: node.getText() });
    }
  });

  function variable(file: string, name: string): ts.Node {
    let found: ts.Node | undefined;
    visit(source(file), (node) => { if (ts.isVariableDeclaration(node) && node.name.getText() === name) found = node.initializer; });
    if (!found) throw new Error(`Missing source registry ${file}:${name}`);
    return resolveNode(found);
  }
  function entries(file: string, name: string): Map<string, { at: string; value: ts.Node }> {
    const out = new Map<string, { at: string; value: ts.Node }>();
    const node = variable(file, name);
    if (!ts.isObjectLiteralExpression(node)) throw new Error(`${name} no longer has an object registry`);
    for (const p of node.properties) if (ts.isPropertyAssignment(p)) {
      const key = ts.isComputedPropertyName(p.name) ? strings(p.name.expression)[0] : p.name.getText().replace(/^['"]|['"]$/g, '');
      if (key) out.set(key, { at: loc(p), value: p.initializer });
    }
    return out;
  }
  const helpFile = 'client/src/hud/statusHelp.ts', iconFile = 'client/src/ui/conceptIcons.ts';
  const playerHelp = entries(helpFile, 'STATUS_HELP'), targetHelp = entries(helpFile, 'TARGET_HELP');
  const dotHelp = entries(helpFile, 'DOT_HELP'), bossHelp = entries('shared/src/systems/bossDebuffs.ts', 'BOSS_DEBUFFS');
  const badge = entries('client/src/hud/targetStatusMeta.ts', 'STATUS_META');
  const iconSets = ['BUFF_IDS', 'DEBUFF_IDS', 'TARGET_BUFF_ICON_IDS', 'TARGET_DEBUFF_ICON_IDS', 'MONSTER_DOT_ART_ICON_IDS', 'ABILITY_IDS'];
  const sets = new Map(iconSets.map((name) => [name, new Set(strings(variable(iconFile, name)))]));
  const aliases = new Map(['ABILITY_ICON_ALIASES', 'BUFF_ICON_ALIASES', 'BUFF_ABILITY_ICON_ALIASES', 'DEBUFF_BUFF_DIR_ICON_ALIASES', 'MONSTER_DOT_ICON_ALIASES', 'TARGET_STATUS_ALIASES', 'BOSS_DEBUFF_ICON_ALIASES', 'CLASS_PIECE_STATUS_ICONS'].map((name) => [name, entries(iconFile, name)]));
  function alias(name: string, id: string): string | undefined { return strings(aliases.get(name)?.get(id)?.value)[0]; }
  function iconPath(id: string, instance?: string, seen = new Set<string>()): string | undefined {
    if (seen.has(id)) return undefined; seen.add(id);
    const classPiece = alias('CLASS_PIECE_STATUS_ICONS', id);
    if (classPiece) return `class-pieces/${classPiece}`;
    if (sets.get('BUFF_IDS')!.has(id)) {
      const rawAbility = alias('BUFF_ABILITY_ICON_ALIASES', id);
      const ability = rawAbility ? alias('ABILITY_ICON_ALIASES', rawAbility) ?? rawAbility : undefined;
      return ability ? sets.get('ABILITY_IDS')!.has(ability) ? `abilities/${ability}` : undefined : `statuses/buffs/${alias('BUFF_ICON_ALIASES', id) ?? id}`;
    }
    if (sets.get('DEBUFF_IDS')!.has(id)) return alias('DEBUFF_BUFF_DIR_ICON_ALIASES', id) ? `statuses/buffs/${alias('DEBUFF_BUFF_DIR_ICON_ALIASES', id)}` : `statuses/debuffs/${id}`;
    if (sets.get('TARGET_BUFF_ICON_IDS')!.has(id)) return `statuses/buffs/${id}`;
    if (sets.get('TARGET_DEBUFF_ICON_IDS')!.has(id) || sets.get('MONSTER_DOT_ART_ICON_IDS')!.has(id)) return `statuses/debuffs/${id}`;
    const dot = alias('MONSTER_DOT_ICON_ALIASES', id); if (dot) return iconPath(dot, undefined, seen);
    if (id === 'second-wind') return 'abilities/second-wind';
    if (id === 'debuff-boss') return `statuses/debuffs/${instance && alias('BOSS_DEBUFF_ICON_ALIASES', instance) || 'debuff-sundered'}`;
    return undefined;
  }
  function targetIcon(id: string): string | undefined {
    if (id.startsWith('barrier:')) return iconPath('granite-barrier');
    const a = alias('TARGET_STATUS_ALIASES', id);
    return iconPath(id) ?? (a && (iconPath(a) ?? (sets.get('ABILITY_IDS')!.has(a) ? `abilities/${a}` : undefined)));
  }
  function add(id: string, at: string, who: string, totalMs = 'yes', via = 'data-driven'): void {
    applications.push({ id, at, carrier: who, totalMs, via });
  }
  const runtime = (file: string, text: string) => {
    const sf = source(file); let found: ts.Node | undefined;
    visit(sf, (node) => { if (!found && ts.isCallExpression(node) && node.expression.getText() === 'applyStatusEffect' && node.getText().includes(text)) found = node; });
    if (!found) throw new Error(`Dynamic writer moved: ${file} / ${text}`);
    return loc(found);
  };
  const monsterDotWriter = runtime('server/src/systems/combat/status/monsterDot.ts', 'debuff.statusEffectId');
  const reservoirWriter = runtime('server/src/systems/combat/damage/weaponReservoir.ts', 'profile.effectId');
  const normalized = (id: string) => id.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const dotIcons = new Map<string, string>();
  function ancestorString(node: ts.Node, key: string): string | undefined {
    let current: ts.Node | undefined = node;
    while (current) {
      const value = strings(prop(current, key))[0]; if (value) return value;
      current = current.parent;
    }
    return undefined;
  }
  // Authoring nodes, rather than every id-like word: reader-only requires/consumes
  // and trigger predicates are deliberately excluded.
  for (const file of files.filter((f) => f.startsWith('shared/'))) visit(source(file), (node) => {
    if (!ts.isPropertyAssignment(node)) return;
    const name = node.name.getText().replace(/^['"]|['"]$/g, '');
    if (name === 'debuffId' && file.startsWith('shared/src/data/monsters/')) {
      for (const key of strings(node.initializer)) {
        const id = `monster-dot:${normalized(key)}`;
        add(id, `${monsterDotWriter}; ${loc(node)}`, 'player');
        const object = node.parent;
        const element = strings(prop(object, 'element'))[0];
        const biome = ancestorString(object, 'biome'), style = ancestorString(object, 'attackStyle');
        const nonPoison = ['fire', 'frost', 'doom'].includes(element ?? '')
          || ['graveyard', 'necropolis', 'volcanic', 'tundra', 'abyss', 'trench'].includes(biome ?? '')
          || ['fire', 'frost', 'void'].includes(style ?? '');
        dotIcons.set(id, nonPoison ? id : 'debuff-poison');
      }
    }
    if (name === 'onHitPoison' && file.startsWith('shared/src/data/monsters/')) {
      const stepName = strings(prop(node.parent, 'name'))[0];
      if (!stepName) throw new Error(`Unresolved poison step name at ${loc(node)}`);
      const id = `monster-dot:${normalized(stepName)}`;
      add(id, `${monsterDotWriter}; ${loc(node)}`, 'player'); dotIcons.set(id, 'debuff-poison');
    }
    if (name !== 'effectId') return;
    const outerName = ts.isPropertyAssignment(node.parent.parent) ? node.parent.parent.name.getText() : '';
    if (['requires', 'consumes', 'armWhenTargetStatus'].includes(outerName)) return;
    let who: string | undefined, writer = '', clock = 'yes';
    if (file.startsWith('shared/src/data/recipes/')) { who = 'monster'; writer = reservoirWriter; }
    if (file === 'shared/src/world/nodeFeatures.ts') {
      who = 'player';
      writer = runtime('server/src/systems/world/nodeFeatures.ts', outerName === 'ambientRamp' ? 'ramp.effectId' : outerName === 'damage' ? 'damage.effectId' : 'se.effectId');
      if (outerName === 'ambientRamp') clock = 'yes (ramp fill)';
    }
    if (file.startsWith('shared/src/data/monsters/')) {
      const kind = strings(prop(node.parent, 'kind'))[0], type = strings(prop(node.parent, 'type'))[0];
      if (kind === 'apply-status') { who = 'player'; writer = runtime('server/src/systems/combat/ai/bossPatterns.ts', 'step.effectId'); }
      else if (outerName === 'appliesDebuff') { who = 'player'; writer = 'server/src/systems/combat/ai/bossPatterns.ts:2373'; }
      else if (outerName === 'erodes') { who = 'player'; writer = 'server/src/systems/world/groundZones.ts:619'; }
      else if (type === 'room-debuff') { who = 'player'; writer = 'server/src/systems/combat/ai/bossScripts.ts:366'; clock = 'timed only'; }
      else if (type === 'shield' || outerName === 'lowHealthWard') { who = 'monster'; writer = 'server/src/systems/combat/engine/combat.ts:1292,1670'; }
      else if (prop(node.parent, 'attackSpeedPct')) { who = 'monster'; writer = 'server/src/systems/combat/engine/combat.ts:1268,1612'; }
    }
    if (who) for (const id of strings(node.initializer)) add(id, `${writer}; ${loc(node)}`, who, clock);
  });

  // Finite expansions of dynamic id constructors. Read their call sites so a new
  // literal root/window is reflected automatically; owner/source suffixes remain
  // a documented family, rather than invented concrete identities.
  for (const file of files.filter((f) => f.startsWith('server/src/systems'))) visit(source(file), (node) => {
    if (!ts.isCallExpression(node)) return;
    const api = node.expression.getText();
    if (api === 'openFrameWindow') for (const id of strings(node.arguments[1])) add(`frame.${id}.window`, `${runtime('server/src/systems/classes/shared/frameLoop.ts', 'frameWindowEffectId(root)')}; ${loc(node)}`, 'player');
    if (api === 'applyStrongestPlayerRider') for (const id of strings(node.arguments[2])) add(id, `server/src/systems/combat/engine/combat.ts:1210; ${loc(node)}`, 'player');
    if (api === 'syncOwnedTargetEffect') for (const id of strings(node.arguments[2])) add(id, `server/src/systems/classes/archetypes/summoner/specs/index.ts:80; ${loc(node)}`, 'monster');
  });
  add('frame.summoner.link.<ownerId>', runtime('server/src/systems/classes/archetypes/summoner/frameLoop.ts', 'id:          linkId').replace(/;$/, ''), 'monster');
  add('barrier:<sourceId>', runtime('server/src/systems/combat/engine/sourceBarriers.ts', 'sourceBarrierEffectId(sourceId)'), 'monster');
  for (const [constant, writer, descriptorLine, icon] of [
    ['ABILITY_GUARD_EFFECT_IDS', 'guardEffectIdForAbility', 23, ''],
    ['ABILITY_RECOVERY_EFFECT_IDS', 'recoveryEffectIdForAbility', 57, 'second-wind'],
  ] as const) {
    for (const id of strings(variable('shared/src/abilities.ts', constant))) {
      add(id, runtime('server/src/systems/player/abilities/abilityFiring.ts', writer), 'player');
      descriptors.set(id, { at: `server/src/systems/player/abilities/abilityBuffs.ts:${descriptorLine}`, reads: [id], icon: icon || id, text: '' });
    }
  }
  // These generic status writers have entity-free inputs; inspect their concrete
  // callers to establish the carried side, rather than guessing from variable names.
  for (const row of applications) {
    if (row.id === 'stunned' || row.id === 'stun-immune') row.carrier = 'both';
    if (['boss-roar-haste', 'boss-rallied', 'monster-death-empower', 'shelled', 'shatter-vulnerable'].includes(row.id)) row.carrier = 'monster';
    if (row.id === 'sun-mark' || row.id === 'plating-shred' && row.at.includes('/status/platingShred.ts') || row.id === 'slow' && row.carrier === '?') row.carrier = 'player';
  }
  // Non-status projections: a live resource/component can produce a tile without
  // ever applying a TracksCombat StatusEffect under that tile's id.
  const rawAliases: Record<string, string[]> = {
    'frame.cooldown.window': ['frame-window'],
    'frame.energy.window': ['energy-frame-surge'], 'frame.summoner.window': ['summoner-frame-frenzy'],
    'frame.summoner.line': ['summoner-frame-line'],
  };
  for (const [raw, ids] of Object.entries(rawAliases)) for (const id of ids) descriptors.get(id)?.reads.push(raw);
  const byId = new Map<string, Application[]>();
  for (const row of applications) byId.set(row.id, [...byId.get(row.id) ?? [], row]);
  descriptors.set('debuff-boss', { at: 'server/src/systems/combat/buffs/buffSync.ts:514', reads: [...bossHelp.keys()], icon: 'debuff-boss', text: 'generic boss-debuff projection' });
  function playerTiles(id: string): string[] {
    if (id.startsWith('monster-dot:')) return ['debuff-dot'];
    if (bossHelp.has(id)) return ['debuff-boss'];
    return [...descriptors].filter(([, row]) => row.reads.includes(id) && !(row.text.includes('targetCs') && !row.text.includes('playerCs'))).map(([key]) => key);
  }
  function coverage(id: string, rows: Application[]) {
    const side = rows.some((r) => r.carrier === 'both') || rows.some((r) => r.carrier === 'player') && rows.some((r) => r.carrier === 'monster') ? 'both' : rows[0].carrier;
    // A bookkeeping record the target mirror never forwards (`isTargetHiddenStatusId`)
    // owes the target frame nothing.
    const hidden = isTargetHiddenStatusId(id);
    const p = side === 'player' || side === 'both', m = (side === 'monster' || side === 'both') && !hidden;
    const tiles = p ? playerTiles(id) : [];
    const help = p && (id.startsWith('monster-dot:') ? dotHelp.has(id.slice(12)) || playerHelp.has('debuff-dot') : bossHelp.has(id) || tiles.some((tile) => playerHelp.has(tile)));
    const targetCopy = m && (targetHelp.has(id) || playerHelp.has(id) || id.startsWith('barrier:'));
    const icons = [...(p ? tiles.map((tile) => iconPath(tile === 'debuff-dot' ? dotIcons.get(id) ?? id : descriptors.get(tile)?.icon ?? tile, tile === 'debuff-boss' ? id : undefined)) : []), ...(m ? [targetIcon(id)] : [])].filter((icon): icon is string => !!icon);
    const missingArt = [...new Set(icons)].filter((icon) => !fs.existsSync(path.join(root, 'client/public/assets/concept-icons', `${icon}.png`)));
    return { side, hidden, tiles, help: Boolean(help), targetCopy: Boolean(targetCopy), badge: m && (badge.has(id) || id.startsWith('barrier:')), icons: [...new Set(icons)], missingArt,
      label: p ? tiles.length ? m ? 'player runtime; target badge/fallback' : 'runtime' : m ? 'target badge/fallback only' : 'none' : badge.has(id) || id.startsWith('barrier:') ? 'authored' : 'fallback',
      tooltip: p && !tiles.length ? m ? 'target fallback only' : 'none' : 'generic builder',
      totalMs: [...new Set(rows.map((r) => r.totalMs))].join('/'),
    };
  }
  const rows = [...byId].sort(([a], [b]) => a.localeCompare(b)).map(([id, evidence]) => ({ id, evidence, ...coverage(id, evidence) }));
  // The slow/root appliers' own writer takes its id as a parameter; every call
  // site's id is expanded above (`applyMonsterSlow` / `applyMonsterRoot`).
  const controlApplier = (row: Dynamic) => row.expression === 'effectId'
    && row.at.startsWith('server/src/systems/combat/status/monsterControl.ts:');
  // The monster rider adapters (`monsterRiders.ts`) forward a config whose id the audit
  // already resolved at its `target.apply` call site.
  const riderAdapter = (row: Dynamic) => row.at.startsWith('server/src/systems/combat/status/monsterRiders.ts:');
  const unexplained = dynamic.filter((row) => !controlApplier(row) && !riderAdapter(row) && !/applyStatusEffect|frameWindowEffectId|sourceBarrierEffectId|recoveryEffectIdForAbility|guardEffectIdForAbility|linkId|step\.effectId|debuff\.effectId|room\.effectId|profile\.effectId|^id$|action\.effectId|buff\.effectId|ward\.effectId|debuff\.statusEffectId|source\.id|pool\.erodes\.effectId|ramp\.effectId|se\.effectId|damage\.effectId/.test(row.expression));
  const uiOnly = [...new Set([...playerHelp.keys(), ...targetHelp.keys(), ...badge.keys()])].filter((id) => !byId.has(id) && !descriptors.has(id) && !['source-barrier', 'enemy-barrier', 'harvest'].includes(id)).sort();
  const bossMeta = entries('client/src/hud/targetStatusMeta.ts', 'BOSS_META');
  const bossCopy = entries(helpFile, 'BOSS_HELP');
  const bossIconAliases = entries(iconFile, 'BOSS_EFFECT_ALIASES');
  const bossEmission = new Map<string, string[]>();
  const bossEmit = (id: string, at: string) => bossEmission.set(id, [...bossEmission.get(id) ?? [], at]);
  for (const file of files) visit(source(file), (node) => {
    if (!ts.isObjectLiteralExpression(node)) return;
    const type = strings(prop(node, 'type'))[0];
    if (type === 'stat-buff' && file.startsWith('shared/src/data/monsters/')) {
      const id = strings(prop(node, 'label'))[0] ?? `stat-buff-${strings(prop(node, 'stat'))[0]}`;
      if (!id.endsWith('undefined')) bossEmit(id, `server/src/systems/combat/ai/bossScripts.ts:674; ${loc(node)}`);
    }
    if (file.startsWith('shared/src/data/monsters/') && prop(node, 'announce')) {
      for (const id of strings(prop(node, 'announce'))) bossEmit(id, `server/src/systems/combat/ai/bossPatterns.ts:367; ${loc(node)}`);
    }
    if (file === 'server/src/systems/combat/ai/bossScripts.ts' && ts.isVariableDeclaration(node.parent)
      && node.parent.type?.getText() === 'ActiveBossEffect' && type) bossEmit(type, loc(node));
  });
  for (const stat of ['attack', 'speed', 'attackSpeed', 'plating', 'damageReduction', 'evasion']) bossEmit(`stat-buff-${stat}`, 'server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback)');
  bossEmit('harvest', 'server/src/systems/combat/ai/bossScripts.ts:355');
  bossEmit('charge-instinct', 'server/src/systems/combat/ai/bossPatterns.ts:281');
  bossEmit('escape-instinct', 'server/src/systems/combat/ai/bossPatterns.ts:282');
  bossEmit('boss-stunned', 'server/src/systems/combat/ai/bossPatterns.ts:465');
  bossEmit('boss-phase', 'client/src/hud/TargetFrame.tsx:48 (client-generated phase tile)');
  const bossRows = [...new Set([...bossMeta.keys(), ...bossCopy.keys(), ...bossEmission.keys()])].sort().map((id) => ({
    id, at: [...new Set(bossEmission.get(id) ?? [])], label: bossMeta.has(id), help: bossCopy.has(id) || id === 'boss-phase',
    icon: strings(bossIconAliases.get(id)?.value)[0] ?? 'none',
  }));
  const unproducedInputs = [...descriptors].filter(([id, row]) => id !== 'debuff-dot' && row.reads.length && row.reads.every((raw) => !byId.has(raw)))
    .map(([id, row]) => ({ id, at: row.at, inputs: row.reads }));
  const usedIconKeys = new Set([...descriptors.values()].map((row) => row.icon));
  for (const group of [...aliases.values(), bossIconAliases]) for (const row of group.values()) for (const value of strings(row.value)) usedIconKeys.add(value);
  for (const id of byId.keys()) usedIconKeys.add(id);
  const unusedIconKeys = [...sets.get('BUFF_IDS')!, ...sets.get('DEBUFF_IDS')!, ...sets.get('TARGET_BUFF_ICON_IDS')!, ...sets.get('TARGET_DEBUFF_ICON_IDS')!, ...sets.get('MONSTER_DOT_ART_ICON_IDS')!]
    .filter((id) => !usedIconKeys.has(id));
  const markdown = (text: string) => text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  // Every gap, one per (id, issue), so an acceptance covers exactly one issue.
  const allGaps: AuditGap[] = [];
  for (const row of rows) {
    const target = row.side !== 'player' && !row.hidden;
    if (row.side !== 'monster' && !row.tiles.length) allGaps.push({ key: row.id, issue: 'player: no tile/projection' });
    if (target && !row.targetCopy) allGaps.push({ key: row.id, issue: 'target: fallback help' });
    if (target && !row.badge) allGaps.push({ key: row.id, issue: 'target: fallback badge' });
    if (!row.icons.length && (target || row.side !== 'monster')) allGaps.push({ key: row.id, issue: 'no authored icon lookup' });
    if (row.missingArt.length) allGaps.push({ key: row.id, issue: `missing icon file: ${row.missingArt.join(', ')}` });
  }
  for (const id of uiOnly) allGaps.push({ key: id, issue: 'authored label/help/badge; no status writer or descriptor found' });
  for (const row of unproducedInputs) allGaps.push({ key: row.id, issue: `descriptor requires unproduced status: ${row.inputs.join(', ')} (${row.at})` });
  for (const id of unusedIconKeys) allGaps.push({ key: `icon key ${id}`, issue: 'icon registry entry has no descriptor, runtime-id or alias consumer' });
  for (const row of bossRows) {
    if (!row.at.length) {
      allGaps.push({ key: `boss channel ${row.id}`, issue: 'authored copy/metadata; no boss-effect producer found' });
    } else if (!row.help || !row.label || row.icon === 'none') {
      const missing = [!row.help ? 'fallback help' : '', !row.label ? 'fallback badge' : '', row.icon === 'none' ? 'no icon alias' : ''];
      allGaps.push({ key: `boss channel ${row.id}`, issue: missing.filter(Boolean).join('; ') });
    }
  }
  const acceptance = (gap: AuditGap): string | undefined => ACCEPTED_GAPS[`${gap.key}: ${gap.issue}`];
  const gaps = allGaps.filter((gap) => acceptance(gap) === undefined);
  const accepted = allGaps.filter((gap) => acceptance(gap) !== undefined)
    .map((gap) => ({ ...gap, reason: acceptance(gap)! }));
  const staleAcceptances = Object.keys(ACCEPTED_GAPS)
    .filter((key) => !allGaps.some((gap) => `${gap.key}: ${gap.issue}` === key));
  const cell = (key: string): string => {
    const match = /^(icon key |boss channel )?(.*)$/.exec(key)!;
    return `${match[1] ?? ''}\`${match[2]}\``;
  };
  const gapLines = ['| ID | Gap |', '| --- | --- |', ...gaps.map((gap) => `| ${cell(gap.key)} | ${gap.issue} |`)];
  const acceptedLines = ['| ID | Accepted gap | Why |', '| --- | --- | --- |',
    ...accepted.map((gap) => `| ${cell(gap.key)} | ${gap.issue} | ${markdown(gap.reason)} |`)];

  return {
    applications, dynamic, unexplained, descriptors, rows, uiOnly, bossRows, unproducedInputs, unusedIconKeys,
    gaps, accepted, staleAcceptances, gapLines, acceptedLines, markdown,
    iconPath: (id: string) => iconPath(id),
    playerHelp: (id: string) => playerHelp.has(id),
  };
}
