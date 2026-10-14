import { EAT_TICKS, SCALE_ATTR, SWEEP_TICKS, TEST_TAG } from './config.ts';
import { loadComponents } from './items.ts';
import { damageId, isMonster, listSize, reportInterop, serverPlayers, tagsOf } from './java.ts';
import { clearDirty, isDirty, markDirty, refreshPlayer } from './players.ts';
import {
  dropEaten,
  eatAround,
  ignoresSuffocation,
  isThreatEntity,
  rescaleAround,
  rescaleEveryone,
  scaleOnSpawn,
} from './threat.ts';

/**
 * The rules in the game. Every tick, players whose inventory changed are counted again and, when
 * their worth moved, the hostiles around them re-scale. Every EAT_TICKS ticks, hostiles standing
 * on dropped diamonds eat them. Every SWEEP_TICKS ticks, everything is counted again in case an
 * event was missed (a mob walking out of a tunnel, a `/give` that changed no tracked slot), and
 * any Java members resolved for the first time are logged.
 */
export function registerEvents(): void {
  loadComponents();
  let ticks = 0;

  ServerEvents.tick((event) => {
    ticks++;
    const server = event.server;
    if (ticks % SWEEP_TICKS === 0) {
      try {
        rescaleEveryone(server);
      } finally {
        reportInterop();
      }
    } else {
      let players = serverPlayers(server);
      let size = listSize(players);
      for (let i = 0; i < size; i++) {
        let player = players.get(i);
        if (isDirty(player) && refreshPlayer(server, player)) rescaleAround(player);
      }
    }
    clearDirty();
    if (ticks % EAT_TICKS === 0) eatAround(serverPlayers(server));
  });

  PlayerEvents.inventoryChanged((event) => {
    markDirty(event.player);
  });

  EntityEvents.spawned((event) => {
    const entity = event.entity;
    if (!isMonster(entity)) return;
    if (tagsOf(entity).contains(TEST_TAG)) {
      (entity as KubeLivingEntity).setAttributeBaseValue(SCALE_ATTR, 4);
      return;
    }
    if (isThreatEntity(entity)) scaleOnSpawn(entity, event.level);
  });

  EntityEvents.death((event) => {
    dropEaten(event.entity);
  });

  EntityEvents.beforeHurt((event) => {
    if (damageId(event.source) !== 'inWall') return;
    if (ignoresSuffocation(event.entity)) event.cancel();
  });
}
