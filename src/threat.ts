import {
  ATTACK_DAMAGE_ATTR,
  EAT_RADIUS,
  HEADROOM_MEASURE,
  KNOCKBACK_RESISTANCE_ATTR,
  MAX_HEALTH_ATTR,
  MOB_KEYS,
  REAPPLY_RADIUS,
  ROAR_COOLDOWN_TICKS,
  SCALE_ATTR,
  SPAWN_RADIUS,
  SUFFOCATION_IMMUNE_ABOVE,
  TEST_TAG,
  WIDTH_MEASURE,
} from './config.ts';
import { type At, dropCommand, eatCommands, growCommands } from './effects.ts';
import { saveStack, toStack } from './items.ts';
import {
  blocksMotionAt,
  boxOf,
  dimensionOf,
  discardEntity,
  gameTimeOf,
  healthOf,
  hitboxOf,
  isAlive,
  isLiving,
  isMonster,
  itemOf,
  levelOf,
  listSize,
  maxHealthOf,
  positionOf,
  serverPlayers,
  tagsOf,
  typeOf,
  uuidOf,
} from './java.ts';
import { eat, isWithin, nearestPlayer, readEaten, writeEatenStacks } from './mobs.ts';
import { levelPlayers, refreshPlayer } from './players.ts';
import {
  type Body,
  healthAfterResize,
  isThreatMob,
  nextScale,
  type Room,
  roomCap,
  scaleChanged,
  scaledStats,
  scaleForWorth,
} from './scale.ts';
import { stackWorth } from './worth.ts';

/** A living monster that takes part: not a boss, not the `/threat test` zombie, not dead. */
export function isThreatEntity(entity: KubeEntity): entity is KubeLivingEntity {
  return (
    isMonster(entity) &&
    isLiving(entity) &&
    isThreatMob(typeOf(entity), true) &&
    isAlive(entity) &&
    !tagsOf(entity).contains(TEST_TAG)
  );
}

function atEntity(entity: KubeEntity): At {
  const at = positionOf(entity);
  return { dimension: dimensionOf(levelOf(entity)), x: at.x, y: at.y, z: at.z };
}

let roomWarned = false;

function clearAcross(
  level: KubeLevel,
  x: number,
  y: number,
  z: number,
  dx: number,
  dz: number,
): number {
  let steps = 0;
  while (steps < WIDTH_MEASURE - 1) {
    let nx = x + dx * (steps + 1);
    let nz = z + dz * (steps + 1);
    if (blocksMotionAt(level, nx, y, nz) || blocksMotionAt(level, nx, y + 1, nz)) break;
    steps++;
  }
  return steps;
}

/**
 * The clear space around a mob: blocks free of collision above its feet, up to 8, and the clear
 * width on the narrower horizontal axis at its feet and one block up, up to 5. If the blocks
 * cannot be read, the room is treated as open and the log says so once.
 */
export function measureRoom(mob: KubeEntity): Room {
  try {
    let level = levelOf(mob);
    let at = positionOf(mob);
    let x = Math.floor(at.x);
    let y = Math.floor(at.y);
    let z = Math.floor(at.z);
    let headroom = 0;
    while (headroom < HEADROOM_MEASURE && !blocksMotionAt(level, x, y + headroom, z)) headroom++;
    let widthX = 1 + clearAcross(level, x, y, z, 1, 0) + clearAcross(level, x, y, z, -1, 0);
    let widthZ = 1 + clearAcross(level, x, y, z, 0, 1) + clearAcross(level, x, y, z, 0, -1);
    return { headroom: headroom, width: Math.min(widthX, widthZ, WIDTH_MEASURE) };
  } catch (error) {
    if (!roomWarned) {
      roomWarned = true;
      console.warn(`Diamond Threat: cannot measure the room around mobs (${String(error)})`);
    }
    return { headroom: HEADROOM_MEASURE, width: WIDTH_MEASURE };
  }
}

/** The mob's hitbox at scale 1: the current hitbox divided by the current scale. */
function bodyOf(mob: KubeLivingEntity): Body {
  const scale = mob.getAttributeTotalValue(SCALE_ATTR) || 1;
  const hitbox = hitboxOf(mob);
  return { height: hitbox.height / scale, width: hitbox.width / scale };
}

/** Scales the mob from one scale to another: size, health, attack, knockback resistance. */
function setScale(mob: KubeLivingEntity, from: number, to: number, effects: boolean): void {
  const data = mob.persistentData;
  if (!data.contains(MOB_KEYS.baseHealth)) {
    data.putDouble(MOB_KEYS.baseHealth, mob.getAttributeBaseValue(MAX_HEALTH_ATTR));
    data.putDouble(MOB_KEYS.baseAttack, mob.getAttributeBaseValue(ATTACK_DAMAGE_ATTR));
    data.putDouble(MOB_KEYS.baseKnockback, mob.getAttributeBaseValue(KNOCKBACK_RESISTANCE_ATTR));
  }
  const baseAttack = data.getDouble(MOB_KEYS.baseAttack);
  const stats = scaledStats(
    {
      maxHealth: data.getDouble(MOB_KEYS.baseHealth),
      attackDamage: baseAttack > 0 ? baseAttack : null,
    },
    to,
  );
  const health = healthOf(mob);
  const oldMax = maxHealthOf(mob);
  mob.setAttributeBaseValue(SCALE_ATTR, to);
  mob.setAttributeBaseValue(MAX_HEALTH_ATTR, stats.maxHealth);
  if (stats.attackDamage !== null) {
    mob.setAttributeBaseValue(ATTACK_DAMAGE_ATTR, stats.attackDamage);
  }
  mob.setAttributeBaseValue(
    KNOCKBACK_RESISTANCE_ATTR,
    Math.max(data.getDouble(MOB_KEYS.baseKnockback), stats.knockbackResistance),
  );
  mob.setHealth(healthAfterResize(health, oldMax, maxHealthOf(mob)));
  data.putDouble(MOB_KEYS.scale, to);

  if (effects && to > from) {
    let now = gameTimeOf(levelOf(mob));
    let roar =
      !data.contains(MOB_KEYS.roaredAt) ||
      now - data.getDouble(MOB_KEYS.roaredAt) >= ROAR_COOLDOWN_TICKS;
    if (roar) data.putDouble(MOB_KEYS.roaredAt, now);
    let hitbox = hitboxOf(mob);
    growCommands(atEntity(mob), hitbox.height, hitbox.width, to, roar).forEach((command) => {
      mob.server.runCommandSilent(command);
    });
  }
}

/**
 * Re-scales one mob for a player's worth plus what the mob has eaten, capped by the room around
 * it when it would grow. Nothing happens when the scale stays the same. `effects` is off for
 * spawns, so mobs that arrive big do not roar.
 */
export function rescale(mob: KubeLivingEntity, playerWorth: number, effects: boolean): void {
  const data = mob.persistentData;
  const applied = data.contains(MOB_KEYS.scale) ? data.getDouble(MOB_KEYS.scale) : 1;
  const wanted = scaleForWorth(playerWorth + data.getInt(MOB_KEYS.eatenWorth));
  const next =
    wanted > applied ? nextScale(applied, wanted, roomCap(measureRoom(mob), bodyOf(mob))) : wanted;
  if (scaleChanged(applied, next)) setScale(mob, applied, next, effects);
}

/** The worth of the nearest player within 64 blocks of the mob, or null if there is none. */
function nearestWorth(mob: KubeEntity, level: KubeLevel): number | null {
  const nearest = nearestPlayer(levelPlayers(level), positionOf(mob), SPAWN_RADIUS);
  return nearest === null ? null : nearest.worth;
}

/** A spawning hostile takes the worth of the nearest player within 64 blocks, if there is one. */
export function scaleOnSpawn(mob: KubeLivingEntity, level: KubeLevel): void {
  const worth = nearestWorth(mob, level);
  if (worth !== null) rescale(mob, worth, false);
}

/** Re-scales every hostile within 48 blocks of the player, each by its own nearest player. */
export function rescaleAround(player: KubePlayer): number {
  const level = levelOf(player);
  const players = levelPlayers(level);
  const here = positionOf(player);
  const entities = level.getEntitiesWithin(boxOf(player).inflate(REAPPLY_RADIUS));
  const size = listSize(entities);
  let count = 0;
  for (let i = 0; i < size; i++) {
    let entity = entities.get(i);
    if (!isThreatEntity(entity)) continue;
    let at = positionOf(entity);
    if (!isWithin(here, at, REAPPLY_RADIUS)) continue;
    let nearest = nearestPlayer(players, at, SPAWN_RADIUS);
    if (nearest === null) continue;
    rescale(entity, nearest.worth, true);
    count++;
  }
  return count;
}

/** Counts every player's worth and re-scales the hostiles around each: the sweep and `/threat apply`. */
export function rescaleEveryone(server: KubeServer): number {
  const players = serverPlayers(server);
  const size = listSize(players);
  let count = 0;
  for (let i = 0; i < size; i++) {
    let player = players.get(i);
    refreshPlayer(server, player);
    count += rescaleAround(player);
  }
  return count;
}

/** The mob eats the dropped item: the item is gone, its worth and its stack stay with the mob. */
function eatItem(mob: KubeLivingEntity, item: KubeItemEntity, worth: number): void {
  const data = mob.persistentData;
  const stack = saveStack(itemOf(item), levelOf(item));
  const before = readEaten(data.getInt(MOB_KEYS.eatenWorth), data.getString(MOB_KEYS.eatenStacks));
  const after = eat(before, worth, stack);
  discardEntity(item);
  data.putInt(MOB_KEYS.eatenWorth, after.worth);
  data.putString(MOB_KEYS.eatenStacks, writeEatenStacks(after));
  eatCommands(atEntity(mob)).forEach((command) => {
    mob.server.runCommandSilent(command);
  });
  rescale(mob, nearestWorth(mob, levelOf(mob)) ?? 0, true);
}

/** The first hostile within EAT_RADIUS of the item, or null. */
function hungryMobNear(item: KubeItemEntity): KubeLivingEntity | null {
  const near = levelOf(item).getEntitiesWithin(boxOf(item).inflate(EAT_RADIUS));
  const size = listSize(near);
  for (let i = 0; i < size; i++) {
    let entity = near.get(i);
    if (isThreatEntity(entity)) return entity;
  }
  return null;
}

/** Dropped items with diamond worth near any player are eaten by a hostile standing on them. */
export function eatAround(players: JavaList<KubePlayer>): void {
  const seen = new Set<string>();
  const playerCount = listSize(players);
  for (let p = 0; p < playerCount; p++) {
    let player = players.get(p);
    let entities = levelOf(player).getEntitiesWithin(boxOf(player).inflate(REAPPLY_RADIUS));
    let size = listSize(entities);
    for (let i = 0; i < size; i++) {
      let entity = entities.get(i);
      if (typeOf(entity) !== 'minecraft:item') continue;
      let uuid = uuidOf(entity);
      if (seen.has(uuid)) continue;
      seen.add(uuid);
      let item = entity as KubeItemEntity;
      let worth = stackWorth(toStack(itemOf(item), 0));
      if (worth <= 0) continue;
      let mob = hungryMobNear(item);
      if (mob !== null) eatItem(mob, item, worth);
    }
  }
}

/** A mob that has eaten drops what it ate where it dies. */
export function dropEaten(mob: KubeLivingEntity): void {
  const data = mob.persistentData;
  if (!data.contains(MOB_KEYS.eatenStacks)) return;
  const eaten = readEaten(data.getInt(MOB_KEYS.eatenWorth), data.getString(MOB_KEYS.eatenStacks));
  data.remove(MOB_KEYS.eatenStacks);
  data.remove(MOB_KEYS.eatenWorth);
  const at = atEntity(mob);
  for (const stack of eaten.stacks) {
    mob.server.runCommandSilent(dropCommand(at, stack));
  }
}

/** Whether the mob is big enough to ignore suffocation. */
export function ignoresSuffocation(mob: KubeLivingEntity): boolean {
  const data = mob.persistentData;
  return data.contains(MOB_KEYS.scale) && data.getDouble(MOB_KEYS.scale) > SUFFOCATION_IMMUNE_ABOVE;
}
