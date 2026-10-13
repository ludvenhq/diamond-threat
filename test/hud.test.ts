import { describe, expect, it } from 'vitest';
import { formatScale, pickupMessage, playerBarId, threatBar, threatColor } from '../src/hud.ts';

describe('formatScale', () => {
  it.each([
    [1, '1'],
    [1.0625, '1.1'],
    [1.5, '1.5'],
    [2, '2'],
    [2.5, '2.5'],
    [3.3125, '3.3'],
    [3.9375, '3.9'],
    [4, '4'],
  ])('x%d reads x%s', (scale, text) => {
    expect(formatScale(scale)).toBe(text);
  });
});

describe('threatColor', () => {
  it('is green below x2, yellow below x3, red from x3', () => {
    expect([0, 7, 8, 15, 16, 24, 90].map(threatColor)).toEqual([
      'green',
      'green',
      'yellow',
      'yellow',
      'red',
      'red',
      'red',
    ]);
  });
});

describe('threatBar', () => {
  it('shows the multiplier and the worth, out of 24 in six notches', () => {
    expect(threatBar(12, 'diamond_threat:threat_x')).toEqual({
      id: 'diamond_threat:threat_x',
      title: 'THREAT x2.5 ◆ 12',
      color: 'yellow',
      notches: 6,
      max: 24,
      value: 12,
    });
  });

  it('keeps counting worth past the cap, with the bar full', () => {
    const bar = threatBar(70, 'a:b');
    expect(bar.title).toBe('THREAT x4 ◆ 70');
    expect(bar.value).toBe(24);
  });

  it('starts at x1 with nothing carried', () => {
    expect(threatBar(0, 'a:b').title).toBe('THREAT x1 ◆ 0');
  });
});

describe('playerBarId', () => {
  it('namespaces the bar per player', () => {
    expect(playerBarId('069a79f4-44e9-4726-a5be-fca90e38aaf5')).toBe(
      'diamond_threat:threat_069a79f4-44e9-4726-a5be-fca90e38aaf5',
    );
  });
});

describe('pickupMessage', () => {
  it('says how much worth was gained, and nothing on a loss', () => {
    expect(pickupMessage(1)).toBe('+1 ◆ mobs grow');
    expect(pickupMessage(9)).toBe('+9 ◆ mobs grow');
    expect(pickupMessage(0)).toBeNull();
    expect(pickupMessage(-3)).toBeNull();
  });
});
