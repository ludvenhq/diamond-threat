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
same(core.scaleForWorth(12), 2.5, 'scale at 12');
same(core.scaleForWorth(24), 4, 'scale at 24');
same(core.scaleForWorth(500), 4, 'scale capped');
var zombie = { height: 1.95, width: 0.6 };
same(core.roomCap({ headroom: 2, width: 5 }, zombie), 1, 'a two-high tunnel');
same(core.roomCap({ headroom: 8, width: 2 }, zombie), 3.3125, 'a two-wide ravine');
same(core.mobScale(20, 4, { headroom: 8, width: 5 }, zombie), 4, 'player and eaten worth add up');
same(core.scaleChanged(2.5, 2.5), false, 'no change');
same(core.scaleChanged(2.5, 2.5625), true, 'one step is a change');

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
same(core.threatBar(12, 'a:b').title, 'THREAT x2.5 ◆ 12', 'bar title at 12');
same(core.threatBar(24, 'a:b').title, 'THREAT x4 ◆ 24', 'bar title at 24');
same(core.threatBar(60, 'a:b').value, 24, 'bar value capped');
same(core.threatColor(7) + core.threatColor(8) + core.threatColor(16), 'greenyellowred', 'colours');
same(core.pickupMessage(3), '+3 ◆ mobs grow', 'pickup message');
same(core.pickupMessage(-1), null, 'no message on a drop');
var commands = core.bossbarCommands(core.threatBar(12, core.playerBarId('0a1b-2c')), 'Alex');
same(
  commands[0],
  'bossbar add diamond_threat:threat_0a1b-2c {"text":"THREAT x2.5 ◆ 12"}',
  'bar add',
);
same(commands[4], 'bossbar set diamond_threat:threat_0a1b-2c max 24', 'bar max');
same(commands[5], 'bossbar set diamond_threat:threat_0a1b-2c value 12', 'bar value');

// Containers, the next scale, the eaten record.
same(core.isContainerItem('minecraft:lime_shulker_box'), true, 'a shulker box opens');
same(core.isContainerItem('minecraft:chest'), false, 'a chest item does not');
same(core.nextScale(3, 2, 1), 2, 'shrinks with worth');
same(core.nextScale(1, 3, 2), 2, 'grows as far as the room allows');
same(core.nextScale(2.5, 3, 1), 2.5, 'never shrinks for room');
var fed = core.eat(core.NOTHING_EATEN, 9, '{count:1,id:"minecraft:diamond_block"}');
var back = core.readEaten(9, core.writeEatenStacks(fed));
same(back.stacks.length, 1, 'eaten round trip length');
same(back.stacks[0], '{count:1,id:"minecraft:diamond_block"}', 'eaten round trip, quotes kept');
same(core.readEaten(3, 'nonsense').stacks.length, 0, 'broken data drops nothing');

// Commands: toFixed and number formatting on Rhino.
same(String(core.roarPitch(2)), '0.95', 'roar pitch at x2');
var at = { dimension: 'minecraft:overworld', x: 10.5, y: 64, z: -3.25 };
same(
  core.growCommands(at, 3.9, 1.2, 2, true).join(' | '),
  'execute in minecraft:overworld run particle minecraft:poof 10.50 65.95 -3.25 0.60 1.30 0.60 0.05 30 normal | ' +
    'execute in minecraft:overworld positioned 10.50 64.00 -3.25 run playsound minecraft:entity.ravager.roar hostile @a[distance=..48] ~ ~ ~ 3 0.95',
  'grow commands',
);
same(
  core.dropCommand(at, '{count:2,id:"minecraft:diamond"}'),
  'execute in minecraft:overworld run summon minecraft:item 10.50 64.50 -3.25 {Item:{count:2,id:"minecraft:diamond"},PickupDelay:10}',
  'drop command',
);
same(core.eatCommands(at).length, 1, 'one eat command');

// The nearest of several players: each pass of the loop must see its own distance.
var three = [
  { id: 'far', x: 30, y: 64, z: 0, worth: 0 },
  { id: 'near', x: 5, y: 64, z: 0, worth: 0 },
  { id: 'mid', x: 10, y: 64, z: 0, worth: 0 },
];
same(core.nearestPlayer(three, { x: 0, y: 64, z: 0 }, 64).id, 'near', 'nearest of three');
