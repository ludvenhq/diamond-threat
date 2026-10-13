import { bossbarCommands } from './bossbar.ts';
import { CAP_WORTH, MOD_ID, OFFSET_KEY, TEST_TAG } from './config.ts';
import { pickupMessage, threatBar } from './hud.ts';
import { markDirty } from './players.ts';
import { rescaleEveryone } from './threat.ts';

/**
 * `/threat test`: proves the whole toolchain in one command. It summons a still zombie four
 * blocks in front of the player, the spawn handler scales it to 4 through the KubeJS attribute
 * API, and a THREAT boss bar and an action bar message appear. If all three show up, the scripts
 * loaded, events fire, attributes can be written and the HUD reads. The test zombie never takes
 * part in the rules.
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

/** `/threat set <player> <worth>`: an offset added to what the player carries, until cleared. */
function setOffset(source: CommandSource, target: KubePlayer, worth: number): number {
  target.persistentData.putInt(OFFSET_KEY, worth);
  markDirty(target);
  source.player?.tell(`Diamond Threat: ${target.username} carries ${String(worth)} extra worth.`);
  return 1;
}

/** `/threat clear <player>`: removes the offset. */
function clearOffset(source: CommandSource, target: KubePlayer): number {
  target.persistentData.remove(OFFSET_KEY);
  markDirty(target);
  source.player?.tell(`Diamond Threat: ${target.username} carries only what is in the inventory.`);
  return 1;
}

/** `/threat apply`: counts every player again and re-scales every hostile around them now. */
function applyNow(source: CommandSource): number {
  const count = rescaleEveryone(source.server);
  source.player?.tell(`Diamond Threat: ${String(count)} hostile mobs re-scaled.`);
  return 1;
}

export function registerCommands(): void {
  ServerEvents.commandRegistry((event) => {
    const commands = event.commands;
    const args = event.arguments;
    event.register(
      commands
        .literal('threat')
        .requires((source) => source.hasPermission(2))
        .then(
          commands
            .literal('test')
            .executes((context) => runTest(context.source))
            .then(commands.literal('clear').executes((context) => clearTest(context.source))),
        )
        .then(
          commands
            .literal('set')
            .then(
              commands
                .argument('player', args.PLAYER.create(event))
                .then(
                  commands
                    .argument('worth', args.INTEGER.create(event))
                    .executes((context) =>
                      setOffset(
                        context.source,
                        args.PLAYER.getResult(context, 'player'),
                        Number(args.INTEGER.getResult(context, 'worth')),
                      ),
                    ),
                ),
            ),
        )
        .then(
          commands
            .literal('clear')
            .then(
              commands
                .argument('player', args.PLAYER.create(event))
                .executes((context) =>
                  clearOffset(context.source, args.PLAYER.getResult(context, 'player')),
                ),
            ),
        )
        .then(commands.literal('apply').executes((context) => applyNow(context.source))),
    );
  });
}
