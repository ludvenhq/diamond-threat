import { ITEM_WORTH } from './config.ts';

/**
 * An item stack as the rules see it. The game glue builds these from inventory slots; `contents`
 * holds what a shulker box or a bundle carries, and is empty for every other item.
 */
export interface Stack {
  id: string;
  count: number;
  contents: Stack[];
}

/** The diamond worth of one stack, including everything nested inside it. */
export function stackWorth(stack: Stack): number {
  let worth = (ITEM_WORTH.get(stack.id) ?? 0) * stack.count;
  for (const inner of stack.contents) {
    worth += stackWorth(inner);
  }
  return worth;
}

/** A player's worth: the sum over every slot they carry (inventory, armour, offhand). */
export function carriedWorth(stacks: Stack[]): number {
  let worth = 0;
  for (const stack of stacks) {
    worth += stackWorth(stack);
  }
  return worth;
}

/** Mobs eat a dropped item when it has any diamond worth, inside it or nested in it. */
export function isEdible(stack: Stack): boolean {
  return stackWorth(stack) > 0;
}
