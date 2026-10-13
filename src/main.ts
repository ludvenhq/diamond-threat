/**
 * Diamond Threat: the entry point the build bundles into one KubeJS server script.
 *
 * KubeJS evaluates every server script in one shared scope and only lets scripts register event
 * handlers while they load. The build wraps this bundle in a function, so nothing here leaks into
 * that scope, and everything below runs once per load (game start and every `/reload`).
 */
import { registerCommands } from './commands.ts';

registerCommands();

console.info(`Diamond Threat ${__VERSION__} loaded`);
