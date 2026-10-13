import { describe, expect, it } from 'vitest';
import { eat, isWithin, nearestPlayer, NOTHING_EATEN, type PlayerWorth } from '../src/mobs.ts';
import { mobScale } from '../src/scale.ts';
import { stackWorth } from '../src/worth.ts';

const player = (id: string, x: number, worth = 0): PlayerWorth => ({ id, x, y: 64, z: 0, worth });
const at = (x: number) => ({ x, y: 64, z: 0 });

describe('eat', () => {
  it('adds a diamond block and a chestplate, and keeps both to drop back', () => {
    const block = { id: 'minecraft:diamond_block', count: 1, contents: [] };
    const chestplate = { id: 'minecraft:diamond_chestplate', count: 1, contents: [] };
    const fed = eat(
      eat(NOTHING_EATEN, stackWorth(block), 'block'),
      stackWorth(chestplate),
      'chest',
    );
    expect(fed).toEqual({ worth: 17, stacks: ['block', 'chest'] });
  });

  it('leaves the state it was given untouched', () => {
    eat(NOTHING_EATEN, 1, 'diamond');
    expect(NOTHING_EATEN).toEqual({ worth: 0, stacks: [] });
  });

  it('makes a mob that ate bigger than the player alone would', () => {
    const fed = eat(NOTHING_EATEN, 8, 'chestplate');
    const open = { headroom: 8, width: 5 };
    const zombie = { height: 1.95, width: 0.6 };
    expect(mobScale(8, fed.worth, open, zombie)).toBe(2);
    expect(mobScale(8, 0, open, zombie)).toBe(1.5);
  });
});

describe('nearestPlayer', () => {
  const players = [player('far', 60, 5), player('near', 10, 2), player('middle', 30, 9)];

  it('picks the nearest player inside the radius', () => {
    expect(nearestPlayer(players, at(0), 64)?.id).toBe('near');
    expect(nearestPlayer(players, at(40), 64)?.id).toBe('middle');
  });

  it('returns null when nobody is in range', () => {
    expect(nearestPlayer(players, at(0), 5)).toBeNull();
    expect(nearestPlayer([], at(0), 64)).toBeNull();
  });

  it('includes a player exactly on the radius', () => {
    expect(nearestPlayer([player('edge', 48)], at(0), 48)?.id).toBe('edge');
  });
});

describe('isWithin', () => {
  it('measures in three dimensions', () => {
    expect(isWithin({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 1)).toBe(true);
    expect(isWithin({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, 1)).toBe(false);
  });
});
