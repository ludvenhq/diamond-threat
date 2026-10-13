# Changelog

All notable changes to Diamond Threat are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). A change to a rule or a default number
is a notable change.

## [Unreleased]

### Changed

- Worth per step of scale lowered from 16 to 8 after the first playtest: mobs are twice their
  size at 8 worth and four times at 24.

### Added

- The project: build pipeline, docs and `/threat test`, which proves the toolchain in game.
- The rules in the game: carried worth (with nested shulker boxes and bundles), growing hostiles
  with the room cap, health, attack and knockback resistance, the roar and particles, drop and
  eat with the eaten items dropped back on death, suffocation immunity for big mobs, the THREAT
  boss bar and the action bar.
- `/threat set`, `/threat clear` and `/threat apply` for testing and filming.
- The lint rule and the build's syntax gate refuse a `const` inside a block, which breaks on every
  Rhino build.
