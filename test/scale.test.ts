import { describe, expect, it } from 'vitest';
import { CAP_WORTH } from '../src/config.ts';
import {
  type Body,
  healthAfterResize,
  isThreatMob,
  mobScale,
  nextScale,
  roomCap,
  scaleChanged,
  scaledStats,
  scaleForWorth,
} from '../src/scale.ts';

const ZOMBIE: Body = { height: 1.95, width: 0.6 };
const ENDERMAN: Body = { height: 2.9, width: 0.6 };
const SPIDER: Body = { height: 0.9, width: 1.4 };
const OPEN = { headroom: 8, width: 5 };

describe('scaleForWorth', () => {
  it.each([
    [0, 1],
    [1, 1.125],
    [4, 1.5],
    [8, 2],
    [12, 2.5],
    [24, 4],
    [500, 4],
    [-5, 1],
  ])('worth %i gives x%d', (worth, scale) => {
    expect(scaleForWorth(worth)).toBe(scale);
  });

  it('caps exactly at the bar maximum', () => {
    expect(CAP_WORTH).toBe(24);
    expect(scaleForWorth(CAP_WORTH - 1)).toBeLessThan(4);
    expect(scaleForWorth(CAP_WORTH)).toBe(4);
  });
});

describe('roomCap', () => {
  it('keeps a zombie normal size in a two-high tunnel', () => {
    expect(roomCap({ headroom: 2, width: 5 }, ZOMBIE)).toBe(1);
  });

  it('lets a zombie grow to about x3.3 in a two-wide ravine', () => {
    expect(roomCap({ headroom: 8, width: 2 }, ZOMBIE)).toBe(3.3125);
  });

  it('lets a zombie reach x4 in the open', () => {
    expect(roomCap(OPEN, ZOMBIE)).toBeGreaterThanOrEqual(4);
  });

  it('stops a tall enderman below x4 even in the open (room is measured up to 8)', () => {
    expect(roomCap(OPEN, ENDERMAN)).toBe(2.75);
  });

  it('holds a wide spider back by width', () => {
    expect(roomCap({ headroom: 8, width: 2 }, SPIDER)).toBe(1.375);
  });

  it('ignores space beyond what is measured', () => {
    expect(roomCap({ headroom: 100, width: 100 }, ZOMBIE)).toBe(roomCap(OPEN, ZOMBIE));
  });

  it('never goes below 1', () => {
    expect(roomCap({ headroom: 1, width: 1 }, ZOMBIE)).toBe(1);
  });

  it('rounds down to a step, so the mob always fits', () => {
    const cap = roomCap({ headroom: 5, width: 5 }, ZOMBIE);
    expect(cap * ZOMBIE.height).toBeLessThanOrEqual(5);
    expect(cap * 16).toBe(Math.round(cap * 16));
  });
});

describe('mobScale', () => {
  it('adds the player worth and the eaten worth', () => {
    expect(mobScale(8, 0, OPEN, ZOMBIE)).toBe(2);
    expect(mobScale(8, 4, OPEN, ZOMBIE)).toBe(2.5);
    expect(mobScale(0, 4, OPEN, ZOMBIE)).toBe(1.5);
  });

  it('is capped by the room', () => {
    expect(mobScale(24, 0, { headroom: 2, width: 5 }, ZOMBIE)).toBe(1);
  });
});

describe('scaledStats', () => {
  it('scales health by s², damage by s, knockback resistance to full at x4', () => {
    expect(scaledStats({ maxHealth: 20, attackDamage: 3 }, 2)).toEqual({
      maxHealth: 80,
      attackDamage: 6,
      knockbackResistance: 1 / 3,
      ignoresSuffocation: true,
    });
    expect(scaledStats({ maxHealth: 20, attackDamage: 3 }, 4).knockbackResistance).toBe(1);
  });

  it('leaves a mob at x1 as it was', () => {
    expect(scaledStats({ maxHealth: 20, attackDamage: 3 }, 1)).toEqual({
      maxHealth: 20,
      attackDamage: 3,
      knockbackResistance: 0,
      ignoresSuffocation: false,
    });
  });

  it('keeps mobs without an attack without one', () => {
    expect(scaledStats({ maxHealth: 20, attackDamage: null }, 3).attackDamage).toBeNull();
  });

  it('ignores suffocation only above x1.5', () => {
    expect(scaledStats({ maxHealth: 20, attackDamage: null }, 1.5).ignoresSuffocation).toBe(false);
    expect(scaledStats({ maxHealth: 20, attackDamage: null }, 1.5625).ignoresSuffocation).toBe(
      true,
    );
  });
});

describe('healthAfterResize', () => {
  it('heals to full when the mob grows', () => {
    expect(healthAfterResize(5, 20, 80)).toBe(80);
  });

  it('caps health when the mob shrinks, and never raises it', () => {
    expect(healthAfterResize(70, 80, 20)).toBe(20);
    expect(healthAfterResize(10, 80, 20)).toBe(10);
  });

  it('leaves health alone when the size stays', () => {
    expect(healthAfterResize(13, 20, 20)).toBe(13);
  });
});

describe('scaleChanged', () => {
  it('is false for the same scale and true for one diamond of difference', () => {
    expect(scaleChanged(2.5, 2.5)).toBe(false);
    expect(scaleChanged(2.5, 2.5625)).toBe(true);
    expect(scaleChanged(2.5, 2.4375)).toBe(true);
  });
});

describe('isThreatMob', () => {
  it('takes every monster except the bosses', () => {
    expect(isThreatMob('minecraft:zombie', true)).toBe(true);
    expect(isThreatMob('minecraft:enderman', true)).toBe(true);
    for (const boss of ['warden', 'ender_dragon', 'wither', 'elder_guardian']) {
      expect(isThreatMob(`minecraft:${boss}`, true)).toBe(false);
    }
  });

  it('never takes animals or other friendly mobs', () => {
    expect(isThreatMob('minecraft:cow', false)).toBe(false);
    expect(isThreatMob('minecraft:villager', false)).toBe(false);
  });
});

describe('nextScale', () => {
  it('shrinks to what worth asks for, whatever the room', () => {
    expect(nextScale(3, 2, 1)).toBe(2);
    expect(nextScale(3, 1, 8)).toBe(1);
  });

  it('grows as far as the room allows', () => {
    expect(nextScale(1, 3, 2)).toBe(2);
    expect(nextScale(1, 3, 4)).toBe(3);
  });

  it('never shrinks a mob because of the room alone', () => {
    expect(nextScale(2.5, 3, 1)).toBe(2.5);
  });
});
