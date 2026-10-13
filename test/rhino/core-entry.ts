/**
 * Exposes the pure rules to test/rhino/core-scenario.js, so the numbers and strings the game will
 * show are checked on real Rhino, not only in Node. scripts/rhino-check.ts bundles this file the
 * same way as the game script.
 */
import { bossbarCommands } from '../../src/bossbar.ts';
import { formatScale, pickupMessage, playerBarId, threatBar, threatColor } from '../../src/hud.ts';
import { eat, isWithin, nearestPlayer, NOTHING_EATEN } from '../../src/mobs.ts';
import {
  healthAfterResize,
  isThreatMob,
  mobScale,
  roomCap,
  scaleChanged,
  scaledStats,
  scaleForWorth,
} from '../../src/scale.ts';
import { carriedWorth, isEdible, stackWorth } from '../../src/worth.ts';

declare function __registerCore(core: Record<string, unknown>): void;

__registerCore({
  bossbarCommands: bossbarCommands,
  formatScale: formatScale,
  pickupMessage: pickupMessage,
  playerBarId: playerBarId,
  threatBar: threatBar,
  threatColor: threatColor,
  eat: eat,
  isWithin: isWithin,
  nearestPlayer: nearestPlayer,
  NOTHING_EATEN: NOTHING_EATEN,
  healthAfterResize: healthAfterResize,
  isThreatMob: isThreatMob,
  mobScale: mobScale,
  roomCap: roomCap,
  scaleChanged: scaleChanged,
  scaledStats: scaledStats,
  scaleForWorth: scaleForWorth,
  carriedWorth: carriedWorth,
  isEdible: isEdible,
  stackWorth: stackWorth,
});
