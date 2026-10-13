import { describe, expect, it } from 'vitest';
import { type Bossbar, bossbarCommands } from '../src/bossbar.ts';

const bar = (overrides: Partial<Bossbar>): Bossbar => ({
  id: 'diamond_threat:alex',
  title: 'THREAT x2.5 ◆ 24',
  color: 'yellow',
  notches: 6,
  max: 48,
  value: 24,
  ...overrides,
});

describe('bossbarCommands', () => {
  it('creates or updates the bar and shows it to one player', () => {
    expect(bossbarCommands(bar({}), 'Alex')).toEqual([
      'bossbar add diamond_threat:alex {"text":"THREAT x2.5 ◆ 24"}',
      'bossbar set diamond_threat:alex name {"text":"THREAT x2.5 ◆ 24"}',
      'bossbar set diamond_threat:alex color yellow',
      'bossbar set diamond_threat:alex style notched_6',
      'bossbar set diamond_threat:alex max 48',
      'bossbar set diamond_threat:alex value 24',
      'bossbar set diamond_threat:alex players Alex',
    ]);
  });

  it('rounds to whole numbers and never sets a max below 1', () => {
    const commands = bossbarCommands(bar({ max: 0, value: 2.6 }), 'Alex');
    expect(commands).toContain('bossbar set diamond_threat:alex max 1');
    expect(commands).toContain('bossbar set diamond_threat:alex value 3');
  });

  it('escapes quotes in the title', () => {
    expect(bossbarCommands(bar({ title: 'say "hi"' }), 'Alex')[0]).toBe(
      'bossbar add diamond_threat:alex {"text":"say \\"hi\\""}',
    );
  });
});
