import { bossbarCommands } from './bossbar.ts';
import { OFFSET_KEY } from './config.ts';
import { pickupMessage, playerBarId, threatBar } from './hud.ts';
import { carriedStacks } from './items.ts';
import { listSize, playersIn, positionOf, uuidOf } from './java.ts';
import type { PlayerWorth } from './mobs.ts';
import { carriedWorth } from './worth.ts';

/** The worth each player's boss bar shows, by UUID. Empty after a load, so the first update only sets the bar. */
const shown = new Map<string, number>();

/** Players whose inventory changed since the last tick. */
const dirty = new Set<string>();

export function markDirty(player: KubePlayer): void {
  dirty.add(uuidOf(player));
}

export function isDirty(player: KubePlayer): boolean {
  return dirty.has(uuidOf(player));
}

export function clearDirty(): void {
  dirty.clear();
}

/** What the player carries plus the `/threat set` offset. */
export function playerWorth(player: KubePlayer): number {
  return carriedWorth(carriedStacks(player)) + player.persistentData.getInt(OFFSET_KEY);
}

/** The worth mobs take from this player: the one on the boss bar, or counted now if there is none yet. */
export function knownWorth(player: KubePlayer): number {
  return shown.get(uuidOf(player)) ?? playerWorth(player);
}

/** The players in a level with their positions and worth, for nearestPlayer. */
export function levelPlayers(level: KubeLevel): PlayerWorth[] {
  const players = playersIn(level);
  const size = listSize(players);
  const result: PlayerWorth[] = [];
  for (let i = 0; i < size; i++) {
    let player = players.get(i);
    let at = positionOf(player);
    result.push({ id: uuidOf(player), x: at.x, y: at.y, z: at.z, worth: knownWorth(player) });
  }
  return result;
}

/**
 * Counts the player's worth and updates the boss bar when it changed, with the action bar line
 * when it went up. Returns true when the worth changed from a value the bar already showed, which
 * is when the mobs around the player re-scale.
 */
export function refreshPlayer(server: KubeServer, player: KubePlayer): boolean {
  const uuid = uuidOf(player);
  const worth = playerWorth(player);
  const before = shown.get(uuid);
  if (before === worth) return false;
  shown.set(uuid, worth);
  bossbarCommands(threatBar(worth, playerBarId(uuid)), player.username).forEach((command) => {
    server.runCommandSilent(command);
  });
  if (before === undefined) return false;
  const message = pickupMessage(worth - before);
  if (message !== null) player.setStatusMessage(message);
  return true;
}
