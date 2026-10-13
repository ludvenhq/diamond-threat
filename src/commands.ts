import { bossbarCommands } from './bossbar.ts';
import { CAP_WORTH, MOD_ID, SCALE_ATTR, TEST_TAG } from './config.ts';
import { pickupMessage, threatBar } from './hud.ts';

/**
 * `/threat test`: proves the whole toolchain in one command. It summons a still zombie four
 * blocks in front of the player, the spawn handler below scales it to 4 through the KubeJS
 * attribute API, and a THREAT boss bar and an action bar message appear. If all three show up,
 * the scripts loaded, events fire, attributes can be written and the HUD reads.
 */
function runTest(source: CommandSource): number {
  const player = source.player;
  if (player === null) {
    console.warn('/threat test needs a player to run it');
    return 0;
  }
  const server = source.server;
  const name = player.username;
  server.runCommandSilent(
    `execute as ${name} at @s run summon minecraft:zombie ^ ^ ^4 {Tags:["${TEST_TAG}"],NoAI:1b,PersistenceRequired:1b}`,
  );
  bossbarCommands(threatBar(CAP_WORTH, `${MOD_ID}:test`), name).forEach((command) => {
    server.runCommandSilent(command);
  });
  player.setStatusMessage(pickupMessage(CAP_WORTH) ?? '');
  player.tell(
    `Diamond Threat ${__VERSION__}: test zombie summoned. It should be four times its size.`,
  );
  return 1;
}

function clearTest(source: CommandSource): number {
  source.server.runCommandSilent(`bossbar remove ${MOD_ID}:test`);
  source.server.runCommandSilent(`kill @e[tag=${TEST_TAG}]`);
  return 1;
}

export function registerCommands(): void {
  ServerEvents.commandRegistry((event) => {
    const commands = event.commands;
    event.register(
      commands
        .literal('threat')
        .requires((source) => source.hasPermission(2))
        .then(
          commands
            .literal('test')
            .executes((context) => runTest(context.source))
            .then(commands.literal('clear').executes((context) => clearTest(context.source))),
        ),
    );
  });

  EntityEvents.spawned('minecraft:zombie', (event) => {
    const entity = event.entity;
    if (entity.tags.contains(TEST_TAG)) {
      (entity as KubeLivingEntity).setAttributeBaseValue(SCALE_ATTR, 4);
    }
  });
}
