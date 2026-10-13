# Diamond Threat

**Minecraft, but the diamonds you carry make the monsters bigger.**

Every diamond in your inventory grows the hostile mobs around you: bigger, tougher, harder to
knock back. Drop your diamonds and they shrink, until a mob walks over them, eats them and grows
for good. Keep them in an ender chest, or throw them into lava.

[![CI](https://github.com/ludvenhq/diamond-threat/actions/workflows/ci.yml/badge.svg)](https://github.com/ludvenhq/diamond-threat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Status: in development, not released yet.** Every rule in [docs/rules.md](docs/rules.md) runs
> in the game and is being playtested. Releases will be on
> CurseForge, Modrinth and the [releases page](https://github.com/ludvenhq/diamond-threat/releases).

## How it plays

- **Worth.** Diamonds count 1, a block of diamond 9, diamond gear its recipe cost. Everything you
  carry counts, including shulker boxes and bundles. Chests in the world and your ender chest do not.
- **Size.** Hostile mobs near you scale by `1 + worth / 8`, up to four times their size at 24
  worth, with more health, damage and knockback resistance. They never grow bigger than the room
  around them.
- **Drop and eat.** Dropping diamonds shrinks the mobs, but a mob that reaches a dropped diamond
  item eats it and keeps its worth until it dies. Kill it to get your diamonds back.
- **On screen.** A `THREAT x2.5 ◆ 24` boss bar and a `+1 ◆ mobs grow` message when you pick one up.

The exact rules, numbers and commands are in [docs/rules.md](docs/rules.md).

## Requirements

| What           | Version                                          |
| -------------- | ------------------------------------------------ |
| Minecraft Java | 1.21.1                                           |
| NeoForge       | 21.1.199 or newer                                |
| KubeJS         | 2101.7.2-build.374 or newer (installs Rhino too) |
| KubeLoader     | 21-0.1.0-Alpha-3 or newer                        |

Diamond Threat is a set of KubeJS scripts packed as a mod with KubeLoader. It has no Java code of
its own. It does not run on Forge, Fabric or Bedrock.

## Install

**CurseForge app or Modrinth App:** create a NeoForge 1.21.1 profile, search for Diamond Threat
and install it. The app installs KubeJS and KubeLoader with it.

**By hand:** put the Diamond Threat jar, KubeJS, Rhino and KubeLoader in the `mods` folder of a
NeoForge 1.21.1 instance.

**Servers:** install the same mods on the server and on every player's game.

**Modpacks that already use KubeJS:** you can skip the jar and KubeLoader. Each release also has
`diamond-threat-<version>.js`; put it in your pack's `kubejs/server_scripts/` folder.

**Check that it works:** open a world with cheats on and run `/threat test`. A zombie four times
its size appears in front of you with a red THREAT boss bar. `/threat test clear` removes them.

## Commands

All commands need operator permission.

| Command                        | What it does                                        |
| ------------------------------ | --------------------------------------------------- |
| `/threat test`                 | Checks the install: a giant test zombie and the bar |
| `/threat test clear`           | Removes the test zombie and the bar                 |
| `/threat set <player> <worth>` | Adds worth to a player, for testing and filming     |
| `/threat clear <player>`       | Removes it                                          |
| `/threat apply`                | Re-scales every hostile mob now                     |

`/threat set`, `/threat clear` and `/threat apply` arrive with the rules.

## Questions

**Nothing happens.** Run `/threat test`. If no zombie appears, open `logs/kubejs/server.log` in
your game folder and look for errors, then [open an issue](https://github.com/ludvenhq/diamond-threat/issues/new/choose)
with the log.

**Can I use it in my modpack or my video?** Yes. It is MIT licensed. A link back is appreciated.

**Other Minecraft versions?** 1.21.1 only for now. The scale attribute was renamed in 1.21.2, and
KubeJS 7 targets 1.21.1.

## Building from source

The scripts are written in TypeScript and compiled into one KubeJS script. You need Node.js 24 and,
for the Rhino checks, a Java 21 JDK:

```sh
npm ci
npm run verify   # lint, types, tests, build, run on real Rhino, pack the jar
```

The jar is in `dist/`. [docs/development.md](docs/development.md) covers the dev loop with a live
game, and [docs/architecture.md](docs/architecture.md) explains how it is built and why.

## Contributing

Ideas, bug reports and pull requests are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md) first.
This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Security issues go to the
address in [SECURITY.md](SECURITY.md), not to public issues.

## License

[MIT](LICENSE). Made by [Ludven](https://ludven.com). Not an official Minecraft product; not
approved by or associated with Mojang or Microsoft.
