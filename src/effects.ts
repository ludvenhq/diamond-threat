import { ROAR_RADIUS } from './config.ts';

/** A place in a level: the dimension id and the coordinates. */
export interface At {
  dimension: string;
  x: number;
  y: number;
  z: number;
}

function coords(x: number, y: number, z: number): string {
  return `${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`;
}

/** Bigger mobs roar lower: about 1.09 at x1.06, 0.65 at x4. */
export function roarPitch(scale: number): number {
  return Math.round((1.25 - 0.15 * scale) * 100) / 100;
}

/**
 * The growth moment: a puff of particles around the grown body and, unless the mob roared a
 * moment ago, a ravager roar that players within ROAR_RADIUS hear.
 */
export function growCommands(
  at: At,
  height: number,
  width: number,
  scale: number,
  roar: boolean,
): string[] {
  const spread = (width / 2).toFixed(2);
  const count = String(Math.round(10 + 10 * scale));
  const commands = [
    `execute in ${at.dimension} run particle minecraft:poof ${coords(at.x, at.y + height / 2, at.z)} ${spread} ${(height / 3).toFixed(2)} ${spread} 0.05 ${count} normal`,
  ];
  if (roar) {
    commands.push(
      `execute in ${at.dimension} positioned ${coords(at.x, at.y, at.z)} run playsound minecraft:entity.ravager.roar hostile @a[distance=..${String(ROAR_RADIUS)}] ~ ~ ~ 3 ${String(roarPitch(scale))}`,
    );
  }
  return commands;
}

/** A mob eats a dropped item: a low crunch where it stands. */
export function eatCommands(at: At): string[] {
  return [
    `execute in ${at.dimension} positioned ${coords(at.x, at.y, at.z)} run playsound minecraft:entity.generic.eat hostile @a[distance=..24] ~ ~ ~ 1.5 0.6`,
  ];
}

/** Drops one eaten stack back where the mob died. `item` is the stack as SNBT. */
export function dropCommand(at: At, item: string): string {
  return `execute in ${at.dimension} run summon minecraft:item ${coords(at.x, at.y + 0.5, at.z)} {Item:${item},PickupDelay:10}`;
}
