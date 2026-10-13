// Drives the bundle's handlers with fake events and checks what they did, on real Rhino. This is
// where Rhino-only behaviour shows up: number formatting, string conversion, scoping. It runs
// after kubejs-stub.js and the bundle, in the same scope.
function check(condition, message) {
  if (!condition) throw new Error('rhino-check: ' + message);
}

function fakePlayer(name) {
  return {
    username: name,
    statusMessages: [],
    messages: [],
    setStatusMessage: function (message) {
      this.statusMessages.push(String(message));
    },
    tell: function (message) {
      this.messages.push(String(message));
    },
  };
}

function fakeServer() {
  return {
    commands: [],
    runCommandSilent: function (command) {
      this.commands.push(String(command));
    },
  };
}

// The bundle loaded and said so.
check(
  __kjs.log.length === 1 && /^info: Diamond Threat \S+ loaded$/.test(__kjs.log[0]),
  'load message, got ' + __kjs.log.join(' | '),
);

// One command registry handler that registers /threat for operators only.
check(__kjs.commandHandlers.length === 1, 'one commandRegistry handler');
var registered = [];
__kjs.commandHandlers[0]({
  commands: {
    literal: function (name) {
      return new FakeLiteral(name);
    },
  },
  register: function (command) {
    registered.push(command);
  },
});
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

// /threat test summons the zombie, shows the boss bar and the action bar.
var player = fakePlayer('Alex');
var server = fakeServer();
var result = threat.child('test').run({ source: { player: player, server: server } });
check(result === 1, '/threat test returns 1, got ' + result);
check(
  server.commands[0] ===
    'execute as Alex at @s run summon minecraft:zombie ^ ^ ^4 {Tags:["diamond_threat_test"],NoAI:1b,PersistenceRequired:1b}',
  'summon command, got ' + server.commands[0],
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
    server.commands[i + 1] === expectedBar[i],
    'boss bar command ' + i + ', got ' + server.commands[i + 1],
  );
}
check(
  player.statusMessages[0] === '+48 ◆ mobs grow',
  'action bar, got ' + player.statusMessages[0],
);
check(player.messages.length === 1, 'one chat message');

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
  .run({ source: { player: player, server: clearServer } });
check(
  clearServer.commands.join(' | ') ===
    'bossbar remove diamond_threat:test | kill @e[tag=diamond_threat_test]',
  'clear commands',
);

// The spawn handler scales the tagged test zombie to 4 and leaves other zombies alone.
check(
  __kjs.spawnedHandlers.length === 1 && __kjs.spawnedHandlers[0].type === 'minecraft:zombie',
  'zombie spawn handler',
);
function fakeZombie(tag) {
  return {
    tags: {
      contains: function (value) {
        return value === tag;
      },
    },
    scaled: [],
    setAttributeBaseValue: function (attribute, value) {
      this.scaled.push(attribute + '=' + value);
    },
  };
}
var testZombie = fakeZombie('diamond_threat_test');
__kjs.spawnedHandlers[0].handler({ entity: testZombie });
check(
  testZombie.scaled.join() === 'minecraft:generic.scale=4',
  'test zombie scaled, got ' + testZombie.scaled.join(),
);
var plainZombie = fakeZombie('something_else');
__kjs.spawnedHandlers[0].handler({ entity: plainZombie });
check(plainZombie.scaled.length === 0, 'plain zombie untouched');
