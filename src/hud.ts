import type { Bossbar, BossbarColor } from './bossbar.ts';
import { CAP_WORTH, MOD_ID, WORTH_PER_SCALE } from './config.ts';
import { scaleForWorth } from './scale.ts';

/** `4`, `2.5`, `1.1`: one decimal at most, no trailing `.0`. */
export function formatScale(scale: number): string {
  const tenths = Math.round(scale * 10);
  const whole = Math.floor(tenths / 10);
  const tenth = tenths % 10;
  return tenth === 0 ? String(whole) : `${String(whole)}.${String(tenth)}`;
}

/** Green below x2, yellow below x3, red from x3. */
export function threatColor(worth: number): BossbarColor {
  if (worth < WORTH_PER_SCALE) return 'green';
  if (worth < 2 * WORTH_PER_SCALE) return 'yellow';
  return 'red';
}

/** Each player's boss bar id. Player UUIDs are lowercase hex and hyphens, valid in an id. */
export function playerBarId(playerUuid: string): string {
  return `${MOD_ID}:threat_${playerUuid}`;
}

/**
 * The THREAT boss bar: the player's own multiplier and worth. It fills to the worth where scale
 * caps, in six notches of x0.5. A mob that has eaten is bigger than the bar says.
 */
export function threatBar(worth: number, id: string): Bossbar {
  return {
    id: id,
    title: `THREAT x${formatScale(scaleForWorth(worth))} ◆ ${String(worth)}`,
    color: threatColor(worth),
    notches: 6,
    max: CAP_WORTH,
    value: Math.min(worth, CAP_WORTH),
  };
}

/** The action bar line when worth goes up; nothing when it goes down or stays. */
export function pickupMessage(gained: number): string | null {
  return gained > 0 ? `+${String(gained)} ◆ mobs grow` : null;
}
