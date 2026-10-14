import { describe, expect, it } from 'vitest';
import { dropCommand, eatCommands, growCommands, roarPitch } from '../src/effects.ts';

const at = { dimension: 'minecraft:overworld', x: 10.5, y: 64, z: -3.25 };

describe('roarPitch', () => {
  it('is lower for bigger mobs', () => {
    expect(roarPitch(1.0625)).toBe(1.09);
    expect(roarPitch(2)).toBe(0.95);
    expect(roarPitch(4)).toBe(0.65);
  });
});

describe('growCommands', () => {
  it('puffs particles around the body and roars, in the mob dimension', () => {
    expect(growCommands(at, 3.9, 1.2, 2, true)).toEqual([
      'execute in minecraft:overworld run particle minecraft:poof 10.50 65.95 -3.25 0.60 1.30 0.60 0.05 30 normal',
      'execute in minecraft:overworld positioned 10.50 64.00 -3.25 run playsound minecraft:entity.ravager.roar hostile @a[distance=..48] ~ ~ ~ 3 0.95',
    ]);
  });

  it('only puffs when the mob roared a moment ago', () => {
    expect(growCommands(at, 3.9, 1.2, 2, false)).toHaveLength(1);
  });
});

describe('eatCommands', () => {
  it('crunches where the mob stands', () => {
    expect(eatCommands({ dimension: 'minecraft:the_nether', x: 0, y: 70, z: 0 })).toEqual([
      'execute in minecraft:the_nether positioned 0.00 70.00 0.00 run playsound minecraft:entity.generic.eat hostile @a[distance=..24] ~ ~ ~ 1.5 0.6',
    ]);
  });
});

describe('dropCommand', () => {
  it('summons the eaten stack, components and all, half a block up', () => {
    const sword =
      '{components:{"minecraft:enchantments":{levels:{"minecraft:sharpness":5}}},count:1,id:"minecraft:diamond_sword"}';
    expect(dropCommand(at, sword)).toBe(
      `execute in minecraft:overworld run summon minecraft:item 10.50 64.50 -3.25 {Item:${sword},PickupDelay:10}`,
    );
  });
});
