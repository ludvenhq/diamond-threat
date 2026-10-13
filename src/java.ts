import { damageMsgId, dimensionId, entityTypeId } from './ids.ts';
import type { Point } from './mobs.ts';

/**
 * Reading Java values in the game, the one place the scripts touch zero-argument members.
 *
 * KubeJS renames and hides vanilla methods for scripts with @RemapForJS and @HideFromJS on its
 * mixins (dev.latvian.mods.kubejs.core.mixin), so the vanilla name often is not there: in
 * KubeJS 2101.7.2, Entity#getStringUUID is `getStringUuid`, Entity#level() and
 * EntityGetter#players() are hidden in favour of KubeJS's `level` and `players` properties,
 * Level#getGameTime is `getTime`, and DamageSource#getMsgId is `getType()`. A plain Rhino outside
 * the game has no mixins and sees the vanilla names. So read() takes the candidate names in
 * order, KubeJS's first, and calls a candidate when it is a method; each read is logged once
 * per load with the name that answered (reportInterop), so the log shows what the game did.
 */
const resolved = new Map<string, string>();
const logged = new Set<string>();

type Getter = (this: object) => unknown;

/** The first candidate the target has: its value, or its result when it is a method. */
export function read(target: object, names: string[]): unknown {
  const members = target as Record<string, unknown>;
  for (const name of names) {
    let value = members[name];
    if (value === undefined || value === null) continue;
    let first = names[0] ?? name;
    if (!resolved.has(first)) resolved.set(first, typeof value === 'function' ? `${name}()` : name);
    return typeof value === 'function' ? (value as Getter).call(target) : value;
  }
  const first = names[0] ?? '?';
  if (!resolved.has(first)) resolved.set(first, 'missing');
  return undefined;
}

/** Logs the members resolved since the last report, once each. */
export function reportInterop(): void {
  const fresh: string[] = [];
  resolved.forEach((how, member) => {
    if (!logged.has(member)) {
      logged.add(member);
      fresh.push(`${member}=${how}`);
    }
  });
  if (fresh.length > 0) console.info(`Diamond Threat interop: ${fresh.join(', ')}`);
}

function num(value: unknown): number {
  return Number(value);
}

function object(value: unknown, what: string): object {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Diamond Threat: cannot read ${what}`);
  }
  return value;
}

// ---- Collections ----

export function listSize(list: JavaList<unknown>): number {
  return num(read(list, ['size']));
}

/** Calls visit for each stack of a Java Iterable<ItemStack>. */
export function forEachStack(iterable: object, visit: (item: ItemStack) => void): void {
  const iterator = object(read(iterable, ['iterator']), 'an iterator');
  while (read(iterator, ['hasNext']) === true) {
    visit(read(iterator, ['next']) as ItemStack);
  }
}

// ---- Entities ----

export function uuidOf(entity: KubeEntity): string {
  return String(read(entity, ['stringUuid', 'getStringUuid', 'stringUUID', 'getStringUUID']));
}

export function typeOf(entity: KubeEntity): string {
  return entityTypeId(String(read(entity, ['type'])));
}

export function levelOf(entity: KubeEntity): KubeLevel {
  return object(read(entity, ['level']), 'a level') as KubeLevel;
}

export function positionOf(entity: KubeEntity): Point {
  return {
    x: num(read(entity, ['x', 'getX'])),
    y: num(read(entity, ['y', 'getY'])),
    z: num(read(entity, ['z', 'getZ'])),
  };
}

export function boxOf(entity: KubeEntity): AABB {
  return object(read(entity, ['boundingBox', 'getBoundingBox']), 'a hitbox') as AABB;
}

/** The current hitbox, already multiplied by the scale attribute. */
export function hitboxOf(entity: KubeEntity): { width: number; height: number } {
  return {
    width: num(read(entity, ['bbWidth', 'getBbWidth'])),
    height: num(read(entity, ['bbHeight', 'getBbHeight'])),
  };
}

export function tagsOf(entity: KubeEntity): JavaStringSet {
  return object(read(entity, ['tags', 'getTags']), 'tags') as JavaStringSet;
}

export function isMonster(entity: KubeEntity): boolean {
  return read(entity, ['monster', 'isMonster']) === true;
}

export function isLiving(entity: KubeEntity): boolean {
  return read(entity, ['living', 'isLiving']) === true;
}

export function isAlive(entity: KubeEntity): boolean {
  return read(entity, ['alive', 'isAlive']) === true;
}

export function healthOf(mob: KubeLivingEntity): number {
  return num(read(mob, ['health', 'getHealth']));
}

export function maxHealthOf(mob: KubeLivingEntity): number {
  return num(read(mob, ['maxHealth', 'getMaxHealth']));
}

/** Removes the entity without a death; by command if the method is not reachable. */
export function discardEntity(entity: KubeEntity): void {
  const discard = (entity as unknown as Record<string, unknown>).discard;
  if (typeof discard === 'function') {
    (discard as Getter).call(entity);
  } else {
    entity.server.runCommandSilent(`kill ${uuidOf(entity)}`);
  }
}

export function itemOf(entity: KubeItemEntity): ItemStack {
  return object(read(entity, ['item', 'getItem']), 'a dropped item') as ItemStack;
}

// ---- Players ----

function inventoryOf(player: KubePlayer): Inventory {
  return object(read(player, ['inventory', 'getInventory']), 'an inventory') as Inventory;
}

export function inventorySize(player: KubePlayer): number {
  return num(read(inventoryOf(player), ['containerSize', 'getContainerSize']));
}

export function inventoryItem(player: KubePlayer, slot: number): ItemStack {
  return inventoryOf(player).getItem(slot);
}

/** The stack on the cursor while a screen is open. */
export function carriedOf(player: KubePlayer): ItemStack {
  const menu = object(read(player, ['containerMenu']), 'the open screen');
  return object(read(menu, ['carried', 'getCarried']), 'the cursor') as ItemStack;
}

// ---- Items ----

export function stackId(stack: ItemStack): string {
  return String(read(stack, ['id', 'getId']));
}

export function stackCount(stack: ItemStack): number {
  return num(read(stack, ['count', 'getCount']));
}

export function isEmptyStack(stack: ItemStack): boolean {
  return read(stack, ['empty', 'isEmpty']) === true;
}

// ---- Levels and the server ----

export function playersIn(level: KubeLevel): JavaList<KubePlayer> {
  return object(read(level, ['players']), 'the players in a level') as JavaList<KubePlayer>;
}

export function dimensionOf(level: KubeLevel): string {
  return dimensionId(String(read(level, ['dimension', 'getDimension'])));
}

export function gameTimeOf(level: KubeLevel): number {
  return num(read(level, ['time', 'getTime', 'gameTime', 'getGameTime']));
}

export function registriesOf(level: KubeLevel): RegistryAccess {
  return object(read(level, ['registryAccess']), 'the registries');
}

/** Whether a mob cannot walk through the block at these coordinates. */
export function blocksMotionAt(level: KubeLevel, x: number, y: number, z: number): boolean {
  const state = object(read(level.getBlock(x, y, z), ['blockState', 'getBlockState']), 'a block');
  return read(state, ['blocksMotion']) === true;
}

export function serverPlayers(server: KubeServer): JavaList<KubePlayer> {
  return object(read(server, ['players']), 'the players') as JavaList<KubePlayer>;
}

/**
 * The damage type's message id, `inWall` for suffocation. KubeJS exposes DamageSource#getMsgId
 * as `getType()`; the property `type` is vanilla's `type()`, the DamageType record.
 */
export function damageId(source: DamageSource): string {
  return damageMsgId(String(read(source, ['getType', 'getMsgId', 'msgId'])));
}
