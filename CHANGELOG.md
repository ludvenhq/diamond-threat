# Changelog

All notable changes to Diamond Threat are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). A change to a rule or a default number
is a notable change.

## [Unreleased]

## [0.1.0] - 2026-10-14

The first release.

### Added

- The rules in the game: carried worth (with nested shulker boxes and bundles), growing hostiles
  with the room cap, health, attack and knockback resistance, the roar and particles, drop and
  eat with the eaten items dropped back on death, suffocation immunity for big mobs, the THREAT
  boss bar and the action bar.
- Mobs are twice their size at 8 worth and four times at 24, the cap (tuned in the first
  playtest, down from 16 worth per step).
- `/threat set`, `/threat clear` and `/threat apply` for testing and filming, and `/threat test`,
  which proves the install in game.
- The build pipeline and docs, with a lint rule and a syntax gate that refuse a `const` inside a
  block, which breaks on every Rhino build.

[Unreleased]: https://github.com/ludvenhq/diamond-threat/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ludvenhq/diamond-threat/releases/tag/v0.1.0
