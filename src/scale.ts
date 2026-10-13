import {
  EXCLUDED_MOBS,
  HEADROOM_MEASURE,
  MAX_SCALE,
  SCALE_STEP,
  SUFFOCATION_IMMUNE_ABOVE,
  WIDTH_MEASURE,
  WORTH_PER_SCALE,
} from './config.ts';

/** The clear space measured around a mob, in blocks. */
export interface Room {
  /** Clear blocks above the mob's feet, measured up to HEADROOM_MEASURE. */
  headroom: number;
  /** Clear width on the narrower horizontal axis, measured up to WIDTH_MEASURE. */
  width: number;
}

/** A mob's bounding box at scale 1, in blocks. A zombie is 1.95 tall and 0.6 wide. */
export interface Body {
  height: number;
  width: number;
}

/** The base attributes a mob had before it was scaled. */
export interface BaseStats {
  maxHealth: number;
  /** Null for mobs without an attack damage attribute (a creeper, a ghast). */
  attackDamage: number | null;
}

export interface ScaledStats {
  maxHealth: number;
  attackDamage: number | null;
  knockbackResistance: number;
  ignoresSuffocation: boolean;
}

/** Whether a mob takes part: every monster except the bosses. */
export function isThreatMob(type: string, isMonster: boolean): boolean {
  return isMonster && !EXCLUDED_MOBS.has(type);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds down to the scale step, so a scale never exceeds the room it was capped by. */
function toStep(scale: number): number {
  return Math.floor(scale / SCALE_STEP + 1e-9) * SCALE_STEP;
}

/** The scale a worth asks for: 1 + worth / 16, from 1 to 4. */
export function scaleForWorth(worth: number): number {
  return toStep(clamp(1 + worth / WORTH_PER_SCALE, 1, MAX_SCALE));
}

/** The largest scale the room allows the body: it must fit both up and across. Never below 1. */
export function roomCap(room: Room, body: Body): number {
  const headroom = Math.min(room.headroom, HEADROOM_MEASURE);
  const width = Math.min(room.width, WIDTH_MEASURE);
  const cap = Math.min(headroom / body.height, width / body.width);
  return Math.max(1, toStep(cap));
}

/**
 * A mob's scale: the nearest player's worth plus what the mob has eaten, capped by the room
 * around it. Room is measured only up to 8 blocks up and 5 across, so a tall mob in the open can
 * still be held below the worth cap (an enderman stops at about 2.7).
 */
export function mobScale(playerWorth: number, eatenWorth: number, room: Room, body: Body): number {
  return Math.min(scaleForWorth(playerWorth + eatenWorth), roomCap(room, body));
}

/**
 * The scale to apply next, from the one applied now, the one worth asks for, and the room cap.
 * Shrinking follows worth at once. Growing goes as far as the room allows but never below the
 * applied scale: a mob that fits where it stands is never shrunk by a rough room measurement.
 */
export function nextScale(applied: number, wanted: number, cap: number): number {
  return wanted <= applied ? wanted : Math.max(applied, Math.min(wanted, cap));
}

/** Health grows with the square of the scale, damage with the scale; knockback resistance is full at x4. */
export function scaledStats(base: BaseStats, scale: number): ScaledStats {
  return {
    maxHealth: base.maxHealth * scale * scale,
    attackDamage: base.attackDamage === null ? null : base.attackDamage * scale,
    knockbackResistance: Math.min(1, (scale - 1) / 3),
    ignoresSuffocation: scale > SUFFOCATION_IMMUNE_ABOVE,
  };
}

/** Growing heals a mob to its new maximum; shrinking only caps its health, never raises it. */
export function healthAfterResize(current: number, oldMax: number, newMax: number): number {
  return newMax > oldMax ? newMax : Math.min(current, newMax);
}

/** Re-applying is skipped when the scale did not change, so mobs never roar for nothing. */
export function scaleChanged(applied: number, next: number): boolean {
  return Math.abs(applied - next) >= SCALE_STEP / 2;
}
