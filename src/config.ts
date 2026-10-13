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

/** One unit of scale per this much worth: scale = 1 + worth / WORTH_PER_SCALE. */
export const WORTH_PER_SCALE = 16;

/** The largest scale; reached at WORTH_PER_SCALE * (MAX_SCALE - 1) = 48 worth. */
export const MAX_SCALE = 4;

/** The worth where scale caps, and the boss bar's maximum. */
export const CAP_WORTH = WORTH_PER_SCALE * (MAX_SCALE - 1);

/** Scales are kept in steps of 1/16, the change one diamond makes. */
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

/** Monsters that never grow: the bosses. */
export const EXCLUDED_MOBS: ReadonlySet<string> = new Set([
  'minecraft:warden',
  'minecraft:ender_dragon',
  'minecraft:wither',
  'minecraft:elder_guardian',
]);
