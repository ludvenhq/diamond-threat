/**
 * Every id and tuning number in one place. The numbers are the defaults in docs/rules.md; when one
 * changes, the rules page and the changelog change with it.
 */

/** The mod id, also the namespace of everything the scripts create in the world. */
export const MOD_ID = 'diamond_threat';

/**
 * The vanilla scale attribute. It is `minecraft:generic.scale` on 1.21.1 and was renamed
 * `minecraft:scale` in 1.21.2, so it lives here and nowhere else.
 */
export const SCALE_ATTR = 'minecraft:generic.scale';

/** The other attributes growing changes, by their 1.21.1 ids (renamed without `generic.` in 1.21.2). */
export const MAX_HEALTH_ATTR = 'minecraft:generic.max_health';
export const ATTACK_DAMAGE_ATTR = 'minecraft:generic.attack_damage';
export const KNOCKBACK_RESISTANCE_ATTR = 'minecraft:generic.knockback_resistance';

/**
 * What the scripts keep in a mob's persistent data, saved with the mob: the scale applied, the
 * base stats from before the first scaling, what it has eaten, and when it last roared.
 */
export const MOB_KEYS = {
  scale: 'diamond_threat_scale',
  baseHealth: 'diamond_threat_base_health',
  baseAttack: 'diamond_threat_base_attack',
  baseKnockback: 'diamond_threat_base_knockback',
  eatenWorth: 'diamond_threat_eaten_worth',
  eatenStacks: 'diamond_threat_eaten',
  roaredAt: 'diamond_threat_roared_at',
};

/** The `/threat set` offset, kept in the player's persistent data until `/threat clear`. */
export const OFFSET_KEY = 'diamond_threat_offset';

/** The tag that marks the zombie `/threat test` summons. */
export const TEST_TAG = `${MOD_ID}_test`;

/**
 * Diamond worth per item: diamonds, what holds a diamond (ore), and what is crafted from them at
 * the recipe's diamond count, so no crafting hides diamonds. Netherite gear does not count.
 */
export const ITEM_WORTH: ReadonlyMap<string, number> = new Map([
  ['minecraft:diamond', 1],
  ['minecraft:diamond_block', 9],
  ['minecraft:diamond_ore', 1],
  ['minecraft:deepslate_diamond_ore', 1],
  ['minecraft:diamond_sword', 2],
  ['minecraft:diamond_pickaxe', 3],
  ['minecraft:diamond_axe', 3],
  ['minecraft:diamond_shovel', 1],
  ['minecraft:diamond_hoe', 2],
  ['minecraft:diamond_helmet', 5],
  ['minecraft:diamond_chestplate', 8],
  ['minecraft:diamond_leggings', 7],
  ['minecraft:diamond_boots', 4],
  ['minecraft:enchanting_table', 2],
  ['minecraft:jukebox', 1],
]);

/**
 * One unit of scale per this much worth: scale = 1 + worth / WORTH_PER_SCALE. Lowered from 16 to 8
 * after the first playtest (2026-10-14): a vein of 4 diamonds made x1.25, too small to see.
 */
export const WORTH_PER_SCALE = 8;

/** The largest scale; reached at WORTH_PER_SCALE * (MAX_SCALE - 1) = 24 worth. */
export const MAX_SCALE = 4;

/** The worth where scale caps, and the boss bar's maximum. */
export const CAP_WORTH = WORTH_PER_SCALE * (MAX_SCALE - 1);

/** Scales are kept in steps of 1/16; one diamond is two steps. */
export const SCALE_STEP = 1 / 16;

/** How far up (blocks) the clear space above a mob is measured. */
export const HEADROOM_MEASURE = 8;

/** How far (blocks, across) the clear width around a mob is measured. */
export const WIDTH_MEASURE = 5;

/** Above this scale a mob takes no suffocation damage. */
export const SUFFOCATION_IMMUNE_ABOVE = 1.5;

/** A spawning hostile takes the worth of the nearest player within this many blocks. */
export const SPAWN_RADIUS = 64;

/** When a player's worth changes, hostiles within this many blocks re-scale. */
export const REAPPLY_RADIUS = 48;

/** The safety sweep runs every this many ticks (20 ticks = 1 second). */
export const SWEEP_TICKS = 20;

/** A hostile eats a dropped item with worth within this many blocks. */
export const EAT_RADIUS = 1;

/** Dropped items are checked for hungry mobs every this many ticks. */
export const EAT_TICKS = 4;

/** A mob roars at most once in this many ticks; its particles show on every growth. */
export const ROAR_COOLDOWN_TICKS = 40;

/** Players within this many blocks hear a roar. */
export const ROAR_RADIUS = 48;

/** How deep shulker boxes and bundles are opened when counting worth. */
export const MAX_NESTING = 4;

/** Monsters that never grow: the bosses. */
export const EXCLUDED_MOBS: ReadonlySet<string> = new Set([
  'minecraft:warden',
  'minecraft:ender_dragon',
  'minecraft:wither',
  'minecraft:elder_guardian',
]);
