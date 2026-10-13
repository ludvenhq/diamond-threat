import { describe, expect, it } from 'vitest';
import { damageMsgId, dimensionId, entityTypeId } from '../src/ids.ts';

describe('entityTypeId', () => {
  it('keeps a KubeJS id and turns a description id into one', () => {
    expect(entityTypeId('minecraft:zombie')).toBe('minecraft:zombie');
    expect(entityTypeId('entity.minecraft.zombie')).toBe('minecraft:zombie');
    expect(entityTypeId('entity.minecraft.item')).toBe('minecraft:item');
    expect(entityTypeId('entity.othermod.big_spider')).toBe('othermod:big_spider');
  });
});

describe('dimensionId', () => {
  it('keeps an id and reads one out of a ResourceKey', () => {
    expect(dimensionId('minecraft:the_nether')).toBe('minecraft:the_nether');
    expect(dimensionId('ResourceKey[minecraft:dimension / minecraft:overworld]')).toBe(
      'minecraft:overworld',
    );
  });
});

describe('damageMsgId', () => {
  it('keeps a message id and reads one out of the DamageType record', () => {
    expect(damageMsgId('inWall')).toBe('inWall');
    expect(damageMsgId('DamageType[msgId=inWall, scaling=never, exhaustion=0.0]')).toBe('inWall');
  });
});
