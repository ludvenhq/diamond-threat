// The pure rules on real Rhino: the same cases the unit tests check in Node, chosen where Rhino
// could differ (number formatting, string conversion, Map and Set, recursion, arrays). Runs after
// the core bundle has called __registerCore.
var core = __core;

function same(actual, expected, what) {
  if (actual !== expected) {
    throw new Error('rhino-check core: ' + what + ': expected ' + expected + ', got ' + actual);
  }
}

function stack(id, count, contents) {
  return { id: id, count: count, contents: contents || [] };
}

// Worth, nested containers included.
same(core.stackWorth(stack('minecraft:diamond', 3)), 3, 'three diamonds');
same(core.stackWorth(stack('minecraft:dirt', 64)), 0, 'dirt');
var bundle = stack('minecraft:bundle', 1, [stack('minecraft:diamond', 5)]);
var shulker = stack('minecraft:shulker_box', 1, [stack('minecraft:diamond_block', 2), bundle]);
same(core.stackWorth(shulker), 23, 'a shulker box with two blocks and a bundle of five');
same(
  core.carriedWorth([
    shulker,
    stack('minecraft:diamond_chestplate', 1),
    stack('minecraft:stone', 10),
  ]),
  31,
  'carried worth',
);
same(core.isEdible(stack('minecraft:diamond_hoe', 1)), true, 'a hoe is edible');
same(core.isEdible(stack('minecraft:netherite_sword', 1)), false, 'netherite is not');

// Scale.
same(core.scaleForWorth(0), 1, 'scale at 0');
same(core.scaleForWorth(24), 2.5, 'scale at 24');
same(core.scaleForWorth(48), 4, 'scale at 48');
same(core.scaleForWorth(500), 4, 'scale capped');
var zombie = { height: 1.95, width: 0.6 };
same(core.roomCap({ headroom: 2, width: 5 }, zombie), 1, 'a two-high tunnel');
same(core.roomCap({ headroom: 8, width: 2 }, zombie), 3.3125, 'a two-wide ravine');
same(core.mobScale(40, 8, { headroom: 8, width: 5 }, zombie), 4, 'player and eaten worth add up');
same(core.scaleChanged(2.5, 2.5), false, 'no change');
same(core.scaleChanged(2.5, 2.5625), true, 'one diamond is a change');

// Stats.
var stats = core.scaledStats({ maxHealth: 20, attackDamage: 3 }, 2);
same(stats.maxHealth, 80, 'health at x2');
same(stats.attackDamage, 6, 'damage at x2');
same(core.scaledStats({ maxHealth: 20, attackDamage: null }, 2).attackDamage, null, 'no attack');
same(core.healthAfterResize(10, 20, 80), 80, 'growing heals');
same(core.healthAfterResize(70, 80, 20), 20, 'shrinking caps');

// Mobs.
same(core.isThreatMob('minecraft:zombie', true), true, 'zombie grows');
same(core.isThreatMob('minecraft:warden', true), false, 'warden does not');
var eaten = core.eat(core.eat(core.NOTHING_EATEN, 9, 'block'), 8, 'chestplate');
same(eaten.worth, 17, 'eaten worth');
same(eaten.stacks.join(','), 'block,chestplate', 'eaten stacks');
same(core.NOTHING_EATEN.stacks.length, 0, 'eat does not change the empty state');
var players = [
  { id: 'far', x: 50, y: 0, z: 0, worth: 1 },
  { id: 'near', x: 10, y: 0, z: 0, worth: 2 },
];
same(core.nearestPlayer(players, { x: 0, y: 0, z: 0 }, 64).id, 'near', 'nearest player');
same(core.nearestPlayer(players, { x: 0, y: 0, z: 0 }, 5), null, 'nobody in range');

// What the screen shows.
same(core.formatScale(4), '4', 'x4');
same(core.formatScale(2.5), '2.5', 'x2.5');
same(core.formatScale(1.0625), '1.1', 'x1.1');
same(core.threatBar(24, 'a:b').title, 'THREAT x2.5 ◆ 24', 'bar title at 24');
same(core.threatBar(48, 'a:b').title, 'THREAT x4 ◆ 48', 'bar title at 48');
same(core.threatBar(60, 'a:b').value, 48, 'bar value capped');
same(
  core.threatColor(15) + core.threatColor(16) + core.threatColor(32),
  'greenyellowred',
  'colours',
);
same(core.pickupMessage(3), '+3 ◆ mobs grow', 'pickup message');
same(core.pickupMessage(-1), null, 'no message on a drop');
var commands = core.bossbarCommands(core.threatBar(24, core.playerBarId('0a1b-2c')), 'Alex');
same(
  commands[0],
  'bossbar add diamond_threat:threat_0a1b-2c {"text":"THREAT x2.5 ◆ 24"}',
  'bar add',
);
same(commands[4], 'bossbar set diamond_threat:threat_0a1b-2c max 48', 'bar max');
same(commands[5], 'bossbar set diamond_threat:threat_0a1b-2c value 24', 'bar value');
