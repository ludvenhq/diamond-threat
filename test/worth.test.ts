import { describe, expect, it } from 'vitest';
import { carriedWorth, isContainerItem, isEdible, type Stack, stackWorth } from '../src/worth.ts';

const stack = (id: string, count = 1, contents: Stack[] = []): Stack => ({
  id: `minecraft:${id}`,
  count,
  contents,
});

describe('worth', () => {
  it.each([
    ['diamond', 1],
    ['diamond_block', 9],
    ['diamond_ore', 1],
    ['deepslate_diamond_ore', 1],
    ['diamond_sword', 2],
    ['diamond_pickaxe', 3],
    ['diamond_axe', 3],
    ['diamond_shovel', 1],
    ['diamond_hoe', 2],
    ['diamond_helmet', 5],
    ['diamond_chestplate', 8],
    ['diamond_leggings', 7],
    ['diamond_boots', 4],
    ['enchanting_table', 2],
    ['jukebox', 1],
    ['netherite_chestplate', 0],
    ['diamond_horse_armor', 0],
    ['stone', 0],
  ])('%s is worth %i', (id, worth) => {
    expect(stackWorth(stack(id))).toBe(worth);
  });

  it('multiplies by the stack size', () => {
    expect(stackWorth(stack('diamond', 64))).toBe(64);
    expect(stackWorth(stack('diamond_block', 3))).toBe(27);
  });

  it('counts a shulker box of diamonds', () => {
    expect(stackWorth(stack('shulker_box', 1, [stack('diamond', 64), stack('diamond', 10)]))).toBe(
      74,
    );
  });

  it('counts a bundle inside a shulker box', () => {
    const bundle = stack('bundle', 1, [stack('diamond', 5), stack('diamond_sword')]);
    const shulker = stack('red_shulker_box', 1, [stack('diamond_block', 2), bundle]);
    expect(stackWorth(shulker)).toBe(18 + 5 + 2);
  });

  it('sums every carried slot', () => {
    expect(
      carriedWorth([
        stack('diamond', 3),
        stack('diamond_chestplate'),
        stack('stone', 64),
        stack('shulker_box', 1, [stack('diamond', 2)]),
      ]),
    ).toBe(13);
    expect(carriedWorth([])).toBe(0);
  });

  it('makes anything with worth edible, including a container holding diamonds', () => {
    expect(isEdible(stack('diamond'))).toBe(true);
    expect(isEdible(stack('diamond_block'))).toBe(true);
    expect(isEdible(stack('diamond_chestplate'))).toBe(true);
    expect(isEdible(stack('shulker_box', 1, [stack('diamond')]))).toBe(true);
    expect(isEdible(stack('shulker_box', 1, [stack('dirt', 64)]))).toBe(false);
    expect(isEdible(stack('rotten_flesh'))).toBe(false);
  });
});

describe('isContainerItem', () => {
  it('opens shulker boxes of every colour and bundles', () => {
    expect(isContainerItem('minecraft:shulker_box')).toBe(true);
    expect(isContainerItem('minecraft:red_shulker_box')).toBe(true);
    expect(isContainerItem('minecraft:bundle')).toBe(true);
    expect(isContainerItem('minecraft:blue_bundle')).toBe(true);
  });

  it('leaves everything else closed', () => {
    expect(isContainerItem('minecraft:chest')).toBe(false);
    expect(isContainerItem('minecraft:diamond')).toBe(false);
    expect(isContainerItem('minecraft:shulker_shell')).toBe(false);
  });
});
