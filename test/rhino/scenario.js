// Drives the bundle's handlers with fake events in a small fake world and checks what they did,
// on real Rhino. This is where Rhino-only behaviour shows up: number formatting, string
// conversion, scoping, Map and Set. It runs after kubejs-stub.js and the bundle, in the same scope.
function check(condition, message) {
  if (!condition) throw new Error('rhino-check: ' + message);
}

function near(actual, expected) {
  return Math.abs(actual - expected) < 1e-9;
}

// ---- Java collections ----

function javaList(items) {
  return {
    size: function () {
      return items.length;
    },
    get: function (index) {
      return items[index];
    },
  };
}

function javaIterable(items) {
  return {
    iterator: function () {
      var index = 0;
      return {
        hasNext: function () {
          return index < items.length;
        },
        next: function () {
          index++;
          return items[index - 1];
        },
      };
    },
  };
}

// ---- NBT, items, boxes ----

function fakeData() {
  var values = new Map();
  return {
    contains: function (key) {
      return values.has(key);
    },
    getDouble: function (key) {
      return values.has(key) ? values.get(key) : 0;
    },
    putDouble: function (key, value) {
      values.set(key, value);
    },
    getInt: function (key) {
      return values.has(key) ? values.get(key) : 0;
    },
    putInt: function (key, value) {
      values.set(key, value);
    },
    getString: function (key) {
      return values.has(key) ? values.get(key) : '';
    },
    putString: function (key, value) {
      values.set(key, value);
    },
    remove: function (key) {
      values.delete(key);
    },
  };
}

// The fakes look like KubeJS from a script, not like vanilla Minecraft: KubeJS renames and
// hides vanilla members (Entity#getStringUUID is `stringUuid`, Entity#level() and
// Level#players() are hidden behind KubeJS's `level` and `players` properties, Level#getGameTime
// is `time`, DamageSource#getMsgId is `getType()`). The vanilla names are deliberately missing
// here, so code that calls them fails this check the way it fails in the game (2026-10-13).
function getter(target, name, read) {
  Object.defineProperty(target, name, { get: read, enumerable: true, configurable: true });
}

function fakeItem(id, count, container, bundle) {
  return {
    id: id,
    count: count,
    empty: count === 0,
    get: function (type) {
      if (type === 'container' && container) {
        return {
          nonEmptyItems: function () {
            return javaIterable(container);
          },
        };
      }
      if (type === 'bundle' && bundle) {
        return {
          items: function () {
            return javaIterable(bundle);
          },
        };
      }
      return null;
    },
    save: function () {
      return {
        toString: function () {
          return '{count:' + count + ',id:"' + id + '"}';
        },
      };
    },
  };
}

var EMPTY = fakeItem('minecraft:air', 0);

function Box(minX, minY, minZ, maxX, maxY, maxZ) {
  this.minX = minX;
  this.minY = minY;
  this.minZ = minZ;
  this.maxX = maxX;
  this.maxY = maxY;
  this.maxZ = maxZ;
}
Box.prototype.inflate = function (d) {
  return new Box(
    this.minX - d,
    this.minY - d,
    this.minZ - d,
    this.maxX + d,
    this.maxY + d,
    this.maxZ + d,
  );
};
Box.prototype.intersects = function (o) {
  return (
    this.minX < o.maxX &&
    this.maxX > o.minX &&
    this.minY < o.maxY &&
    this.maxY > o.minY &&
    this.minZ < o.maxZ &&
    this.maxZ > o.minZ
  );
};

// ---- The world ----

function fakeServer() {
  var server = { commands: [], playerArray: [] };
  server.runCommandSilent = function (command) {
    server.commands.push(String(command));
  };
  getter(server, 'players', function () {
    return javaList(server.playerArray);
  });
  return server;
}

function fakeLevel() {
  var level = { entities: [], playerList: [], time: 1000, dimension: 'minecraft:overworld' };
  level.solid = function () {
    return false;
  };
  level.getBlock = function (x, y, z) {
    return {
      blockState: {
        blocksMotion: function () {
          return level.solid(x, y, z);
        },
      },
    };
  };
  getter(level, 'players', function () {
    return javaList(level.playerList);
  });
  level.getEntitiesWithin = function (box) {
    var found = [];
    for (var i = 0; i < level.entities.length; i++) {
      var entity = level.entities[i];
      if (!entity.removed && entity.boundingBox.intersects(box)) found.push(entity);
    }
    return javaList(found);
  };
  level.registryAccess = function () {
    return {};
  };
  return level;
}

var nextUuid = 0;

function fakeEntity(level, server, type, x, y, z, width, height) {
  nextUuid++;
  var entity = {
    type: type,
    removed: false,
    tagList: [],
    persistentData: fakeData(),
    server: server,
    level: level,
    x: x,
    y: y,
    z: z,
    monster: false,
    living: false,
    stringUuid: '00000000-0000-0000-0000-' + ('000000000000' + nextUuid).slice(-12),
    messages: [],
  };
  entity.uuid = entity.stringUuid;
  entity.scale = function () {
    return 1;
  };
  getter(entity, 'alive', function () {
    return !entity.removed;
  });
  entity.tags = {
    contains: function (tag) {
      return entity.tagList.indexOf(tag) >= 0;
    },
  };
  getter(entity, 'bbWidth', function () {
    return width * entity.scale();
  });
  getter(entity, 'bbHeight', function () {
    return height * entity.scale();
  });
  getter(entity, 'boundingBox', function () {
    var half = entity.bbWidth / 2;
    return new Box(x - half, y, z - half, x + half, y + entity.bbHeight, z + half);
  });
  entity.discard = function () {
    entity.removed = true;
  };
  entity.tell = function (message) {
    entity.messages.push(String(message));
  };
  level.entities.push(entity);
  return entity;
}

var SCALE = 'minecraft:generic.scale';
var MAX_HEALTH = 'minecraft:generic.max_health';
var ATTACK = 'minecraft:generic.attack_damage';
var KNOCKBACK = 'minecraft:generic.knockback_resistance';

function fakeMob(level, server, type, x, y, z, width, height, attack) {
  var mob = fakeEntity(level, server, type, x, y, z, width, height);
  mob.attrs = {};
  mob.attrs[SCALE] = 1;
  mob.attrs[MAX_HEALTH] = 20;
  mob.attrs[KNOCKBACK] = 0;
  if (attack !== null) mob.attrs[ATTACK] = attack;
  mob.health = 20;
  mob.monster = true;
  mob.living = true;
  mob.scale = function () {
    return mob.attrs[SCALE];
  };
  mob.getAttributeBaseValue = function (id) {
    return id in mob.attrs ? mob.attrs[id] : 0;
  };
  mob.getAttributeTotalValue = mob.getAttributeBaseValue;
  mob.setAttributeBaseValue = function (id, value) {
    if (id in mob.attrs) mob.attrs[id] = value;
  };
  mob.setHealth = function (value) {
    mob.health = Math.min(value, mob.attrs[MAX_HEALTH]);
  };
  getter(mob, 'maxHealth', function () {
    return mob.attrs[MAX_HEALTH];
  });
  return mob;
}

function fakePlayer(level, server, name, x, y, z) {
  var player = fakeEntity(level, server, 'minecraft:player', x, y, z, 0.6, 1.8);
  player.username = name;
  player.slots = [];
  player.carried = EMPTY;
  player.statusMessages = [];
  player.living = true;
  player.inventory = {
    containerSize: 41,
    getItem: function (slot) {
      return player.slots[slot] || EMPTY;
    },
  };
  player.containerMenu = {};
  getter(player.containerMenu, 'carried', function () {
    return player.carried;
  });
  player.setStatusMessage = function (message) {
    player.statusMessages.push(String(message));
  };
  level.playerList.push(player);
  server.playerArray.push(player);
  return player;
}

function fakeDrop(level, server, item, x, y, z) {
  var drop = fakeEntity(level, server, 'minecraft:item', x, y, z, 0.25, 0.25);
  drop.item = item;
  return drop;
}

function commandsLike(server, pattern) {
  var found = [];
  for (var i = 0; i < server.commands.length; i++) {
    if (pattern.test(server.commands[i])) found.push(server.commands[i]);
  }
  return found;
}

// ---- Loading ----

check(
  __kjs.log.length === 1 && /^info: Diamond Threat \S+ loaded$/.test(__kjs.log[0]),
  'load message, got ' + __kjs.log.join(' | '),
);
check(
  __kjs.loadedClasses.join() === 'net.minecraft.core.component.DataComponents',
  'DataComponents loaded once, got ' + __kjs.loadedClasses.join(),
);
check(__kjs.tickHandlers.length === 1, 'one tick handler');
check(__kjs.inventoryHandlers.length === 1, 'one inventoryChanged handler');
check(__kjs.deathHandlers.length === 1, 'one death handler');
check(__kjs.hurtHandlers.length === 1, 'one beforeHurt handler');
check(
  __kjs.spawnedHandlers.length === 1 && __kjs.spawnedHandlers[0].type === null,
  'one spawned handler for every entity',
);

// ---- Commands ----

check(__kjs.commandHandlers.length === 1, 'one commandRegistry handler');
var registered = [];
var commandEvent = {
  commands: {
    literal: function (name) {
      return new FakeLiteral(name);
    },
    argument: function (name, type) {
      return new FakeLiteral(name, type);
    },
  },
  register: function (command) {
    registered.push(command);
  },
};
commandEvent.arguments = {
  PLAYER: {
    create: function (event) {
      check(event === commandEvent, 'PLAYER argument made from the event');
      return 'player-argument';
    },
    getResult: function (context, name) {
      return context.args[name];
    },
  },
  INTEGER: {
    create: function () {
      return 'integer-argument';
    },
    getResult: function (context, name) {
      return context.args[name];
    },
  },
};
__kjs.commandHandlers[0](commandEvent);
check(registered.length === 1 && registered[0].name === 'threat', '/threat registered');
var threat = registered[0];
check(
  threat.predicate({
    hasPermission: function (level) {
      return level <= 2;
    },
  }) === true,
  'ops may run /threat',
);
check(
  threat.predicate({
    hasPermission: function (level) {
      return level <= 0;
    },
  }) === false,
  'players may not',
);
check(threat.child('set').child('player').type === 'player-argument', '/threat set <player>');
check(
  threat.child('set').child('player').child('worth').type === 'integer-argument',
  '/threat set <player> <worth>',
);

// /threat test summons the zombie, shows the boss bar and the action bar.
var testServer = fakeServer();
var testLevel = fakeLevel();
var tester = fakePlayer(testLevel, testServer, 'Alex', 0, 64, 0);
var result = threat.child('test').run({ source: { player: tester, server: testServer } });
check(result === 1, '/threat test returns 1, got ' + result);
check(
  testServer.commands[0] ===
    'execute as Alex at @s run summon minecraft:zombie ^ ^ ^4 {Tags:["diamond_threat_test"],NoAI:1b,PersistenceRequired:1b}',
  'summon command, got ' + testServer.commands[0],
);
var expectedBar = [
  'bossbar add diamond_threat:test {"text":"THREAT x4 ◆ 48"}',
  'bossbar set diamond_threat:test name {"text":"THREAT x4 ◆ 48"}',
  'bossbar set diamond_threat:test color red',
  'bossbar set diamond_threat:test style notched_6',
  'bossbar set diamond_threat:test max 48',
  'bossbar set diamond_threat:test value 48',
  'bossbar set diamond_threat:test players Alex',
];
for (var i = 0; i < expectedBar.length; i++) {
  check(
    testServer.commands[i + 1] === expectedBar[i],
    'boss bar command ' + i + ', got ' + testServer.commands[i + 1],
  );
}
check(
  tester.statusMessages[0] === '+48 ◆ mobs grow',
  'action bar, got ' + tester.statusMessages[0],
);
check(tester.messages.length === 1, 'one chat message');

// /threat test from the console has no player and does nothing.
var consoleServer = fakeServer();
check(
  threat.child('test').run({ source: { player: null, server: consoleServer } }) === 0,
  'console run returns 0',
);
check(consoleServer.commands.length === 0, 'console run runs no commands');

// /threat test clear removes the bar and the zombie.
var clearServer = fakeServer();
threat
  .child('test')
  .child('clear')
  .run({ source: { player: tester, server: clearServer } });
check(
  clearServer.commands.join(' | ') ===
    'bossbar remove diamond_threat:test | kill @e[tag=diamond_threat_test]',
  'clear commands',
);

// The spawn handler scales the tagged test zombie to 4.
var spawned = __kjs.spawnedHandlers[0].handler;
var testZombie = fakeMob(testLevel, testServer, 'minecraft:zombie', 0, 64, 4, 0.6, 1.95, 3);
testZombie.tagList.push('diamond_threat_test');
spawned({ entity: testZombie, level: testLevel });
check(testZombie.attrs[SCALE] === 4, 'test zombie scaled to 4, got ' + testZombie.attrs[SCALE]);

// ---- The rules in a world ----

var server = fakeServer();
var level = fakeLevel();
var tick = __kjs.tickHandlers[0];
function ticks(count) {
  for (var t = 0; t < count; t++) {
    level.time++;
    tick({ server: server });
  }
}

// Alex carries 8 diamonds and a shulker box holding a bundle of 8 more: 16 worth, x2.
var alex = fakePlayer(level, server, 'Alex', 0, 64, 0);
var alexBar = 'diamond_threat:threat_' + alex.uuid;
alex.slots[0] = fakeItem('minecraft:diamond', 8);
alex.slots[1] = fakeItem('minecraft:shulker_box', 1, [
  fakeItem('minecraft:bundle', 1, null, [fakeItem('minecraft:diamond', 8)]),
]);
var zombie = fakeMob(level, server, 'minecraft:zombie', 5, 64, 0, 0.6, 1.95, 3);
var creeper = fakeMob(level, server, 'minecraft:creeper', -5, 64, 0, 0.6, 1.7, null);
var warden = fakeMob(level, server, 'minecraft:warden', 0, 64, 8, 0.9, 2.9, 30);
var farZombie = fakeMob(level, server, 'minecraft:zombie', 100, 64, 0, 0.6, 1.95, 3);

// Nothing happens before the first sweep.
ticks(19);
check(server.commands.length === 0, 'quiet before the sweep, got ' + server.commands.join(' | '));

// The sweep: the boss bar appears, the mobs within 48 blocks grow and roar.
ticks(1);
check(
  server.commands.indexOf('bossbar add ' + alexBar + ' {"text":"THREAT x2 ◆ 16"}') >= 0,
  'boss bar shows x2 and 16, got ' + server.commands.join(' | '),
);
check(server.commands.indexOf('bossbar set ' + alexBar + ' color yellow') >= 0, 'bar is yellow');
check(server.commands.indexOf('bossbar set ' + alexBar + ' players Alex') >= 0, 'bar for Alex');
check(alex.statusMessages.length === 0, 'no action bar on the first count');
check(zombie.attrs[SCALE] === 2, 'zombie x2, got ' + zombie.attrs[SCALE]);
check(zombie.attrs[MAX_HEALTH] === 80, 'zombie max health 80, got ' + zombie.attrs[MAX_HEALTH]);
check(zombie.health === 80, 'zombie healed to 80, got ' + zombie.health);
check(zombie.attrs[ATTACK] === 6, 'zombie attack 6, got ' + zombie.attrs[ATTACK]);
check(
  near(zombie.attrs[KNOCKBACK], 1 / 3),
  'zombie knockback resistance, got ' + zombie.attrs[KNOCKBACK],
);
check(creeper.attrs[SCALE] === 2 && !(ATTACK in creeper.attrs), 'creeper grows, no attack added');
check(warden.attrs[SCALE] === 1, 'the warden never grows');
check(farZombie.attrs[SCALE] === 1, 'a zombie 100 blocks away does not grow');
var roars = commandsLike(server, /ravager\.roar/);
check(roars.length === 2, 'zombie and creeper roar, got ' + roars.length);
check(
  roars[0] ===
    'execute in minecraft:overworld positioned 5.00 64.00 0.00 run playsound minecraft:entity.ravager.roar hostile @a[distance=..48] ~ ~ ~ 3 0.95',
  'roar command, got ' + roars[0],
);
check(commandsLike(server, /particle minecraft:poof/).length === 2, 'two puffs');

// Picking up 16 more diamonds: the action bar, a red x3 bar, the zombie grows at once without a
// second roar so soon.
server.commands = [];
alex.slots[2] = fakeItem('minecraft:diamond', 16);
__kjs.inventoryHandlers[0]({ player: alex });
ticks(1);
check(
  alex.statusMessages.join() === '+16 ◆ mobs grow',
  'action bar +16, got ' + alex.statusMessages.join(),
);
check(
  server.commands.indexOf('bossbar set ' + alexBar + ' name {"text":"THREAT x3 ◆ 32"}') >= 0,
  'bar shows x3 and 32',
);
check(server.commands.indexOf('bossbar set ' + alexBar + ' color red') >= 0, 'bar is red');
check(zombie.attrs[SCALE] === 3 && zombie.health === 180, 'zombie x3 with 180 health');
check(commandsLike(server, /ravager\.roar/).length === 0, 'no second roar within two seconds');
check(commandsLike(server, /particle/).length === 2, 'but the puffs show');

// Dropping them again: the zombie shrinks, its health is capped, never raised.
zombie.health = 50;
alex.slots[2] = EMPTY;
__kjs.inventoryHandlers[0]({ player: alex });
ticks(1);
check(zombie.attrs[SCALE] === 2, 'zombie back to x2, got ' + zombie.attrs[SCALE]);
check(zombie.health === 50, 'health kept at 50, got ' + zombie.health);
check(alex.statusMessages.length === 1, 'no action bar when worth goes down');

// A zombie spawning in a two-high tunnel stays normal size; one in the open arrives big and quiet.
level.solid = function (x, y, z) {
  return z >= 18 && y >= 66;
};
server.commands = [];
var tunnelZombie = fakeMob(level, server, 'minecraft:zombie', 0, 64, 20, 0.6, 1.95, 3);
spawned({ entity: tunnelZombie, level: level });
check(tunnelZombie.attrs[SCALE] === 1, 'tunnel zombie stays x1, got ' + tunnelZombie.attrs[SCALE]);
var openZombie = fakeMob(level, server, 'minecraft:zombie', -10, 64, 10, 0.6, 1.95, 3);
spawned({ entity: openZombie, level: level });
check(openZombie.attrs[SCALE] === 2, 'open zombie arrives x2, got ' + openZombie.attrs[SCALE]);
check(server.commands.length === 0, 'spawns make no sound or particles');

// A diamond block dropped at the zombie's feet is eaten: gone, 9 worth on the zombie, x2.5625.
var block = fakeDrop(level, server, fakeItem('minecraft:diamond_block', 1), 5.5, 64, 0);
var dirt = fakeDrop(level, server, fakeItem('minecraft:dirt', 64), 4.5, 64, 0);
ticks(4);
check(block.removed, 'the diamond block is eaten');
check(!dirt.removed, 'dirt is not');
check(zombie.persistentData.getInt('diamond_threat_eaten_worth') === 9, 'zombie ate 9 worth');
check(zombie.attrs[SCALE] === 2.5625, 'zombie x2.5625, got ' + zombie.attrs[SCALE]);
check(commandsLike(server, /entity\.generic\.eat/).length === 1, 'one crunch');

// When it dies it drops the block back and forgets it.
server.commands = [];
__kjs.deathHandlers[0]({ entity: zombie });
check(
  server.commands.join(' | ') ===
    'execute in minecraft:overworld run summon minecraft:item 5.00 64.50 0.00 {Item:{count:1,id:"minecraft:diamond_block"},PickupDelay:10}',
  'drops the block back, got ' + server.commands.join(' | '),
);
check(!zombie.persistentData.contains('diamond_threat_eaten'), 'eaten stacks cleared');
server.commands = [];
__kjs.deathHandlers[0]({ entity: creeper });
check(server.commands.length === 0, 'a mob that ate nothing drops nothing extra');

// Big mobs ignore suffocation; normal-sized ones and other damage are untouched.
function hurt(entity, msgId) {
  var cancelled = false;
  __kjs.hurtHandlers[0]({
    entity: entity,
    source: {
      getType: function () {
        return msgId;
      },
      type: function () {
        return {
          toString: function () {
            return 'DamageType[msgId=' + msgId + ', scaling=never, exhaustion=0.1]';
          },
        };
      },
    },
    cancel: function () {
      cancelled = true;
    },
  });
  return cancelled;
}
check(hurt(zombie, 'inWall') === true, 'x2.5 zombie ignores suffocation');
check(hurt(zombie, 'mob') === false, 'but not a hit');
check(hurt(tunnelZombie, 'inWall') === false, 'a normal-sized zombie suffocates');

// /threat set adds 10 worth until /threat clear.
var source = { player: alex, server: server };
check(
  threat
    .child('set')
    .child('player')
    .child('worth')
    .run({ source: source, args: { player: alex, worth: 10 } }) === 1,
  '/threat set returns 1',
);
ticks(1);
check(
  server.commands.indexOf('bossbar set ' + alexBar + ' name {"text":"THREAT x2.6 ◆ 26"}') >= 0,
  'bar shows the offset, got ' + server.commands.join(' | '),
);
check(
  alex.statusMessages[1] === '+10 ◆ mobs grow',
  'action bar +10, got ' + alex.statusMessages[1],
);
threat
  .child('clear')
  .child('player')
  .run({ source: source, args: { player: alex } });
ticks(1);
check(
  server.commands.indexOf('bossbar set ' + alexBar + ' name {"text":"THREAT x2 ◆ 16"}') >= 0,
  'bar back to 16',
);

// /threat apply re-scales everything now and says how many.
check(threat.child('apply').run({ source: source }) === 1, '/threat apply returns 1');
check(/hostile mobs re-scaled\.$/.test(alex.messages[alex.messages.length - 1]), 'apply reports');
