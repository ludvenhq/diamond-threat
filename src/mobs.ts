/** A position in a level. */
export interface Point {
  x: number;
  y: number;
  z: number;
}

/** A player as the rules see them: where they are and what they carry. */
export interface PlayerWorth extends Point {
  id: string;
  worth: number;
}

/**
 * What a mob has eaten: the worth it adds to its scale, and the stacks it drops when it dies. The
 * game glue stores the stacks as strings it can turn back into items with their enchantments.
 */
export interface Eaten {
  worth: number;
  stacks: string[];
}

export const NOTHING_EATEN: Eaten = { worth: 0, stacks: [] };

/** The mob eats a dropped stack: its worth adds up, and the stack is kept to drop back. */
export function eat(eaten: Eaten, stackWorth: number, stack: string): Eaten {
  return { worth: eaten.worth + stackWorth, stacks: eaten.stacks.concat([stack]) };
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function isWithin(a: Point, b: Point, radius: number): boolean {
  return distanceSquared(a, b) <= radius * radius;
}

/** The nearest player within the radius, or null. Players must be in the same level. */
export function nearestPlayer(
  players: PlayerWorth[],
  at: Point,
  radius: number,
): PlayerWorth | null {
  let best: PlayerWorth | null = null;
  let bestDistance = radius * radius;
  for (const player of players) {
    const distance = distanceSquared(player, at);
    if (distance <= bestDistance) {
      best = player;
      bestDistance = distance;
    }
  }
  return best;
}
