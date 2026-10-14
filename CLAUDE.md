# Diamond Threat

A Minecraft Java 1.21.1 mod: KubeJS server scripts written in TypeScript, packed as a NeoForge
jar with KubeLoader. Published by Ludven (github.com/ludvenhq). This repo will be public: write
nothing here or in commits that should not be read by players.

- **Read first:** `README.md`, `docs/rules.md` (the game rules, the spec for the code),
  `docs/architecture.md` (the pipeline and the Rhino limits), `docs/development.md`.
- **The design and its decisions** live in the studio hub repo:
  `docs/designs/2026-10-12-minecraft-challenge-boxes.md` in `ludvenhq/hub`.
- **Rhino:** most players run release Rhino (2101.2.7-build.85). No spread, rest, default values,
  shorthand object properties, computed keys, classes or async in `src/`. Lint and the build's
  syntax gate enforce it; `npm run check:rhino` proves it on builds 81, 85 and 91.
- **Done means `npm run verify` is green.** On this machine Java comes from WebStorm's runtime:
  `JAVA_HOME="C:/Program Files/JetBrains/WebStorm 2025.2.5/jbr"`. Without it the Rhino and jar
  checks are skipped, which is not done.
- **Tests:** the rules and the build tools are unit tested; every handler gets a case in
  `test/rhino/scenario.js`. Do not add tests for code that only calls the game.
- **Branches:** work on `dev`. `main` is what is released and moves only by a pull request that
  Vlad merges. Never push to `main`, never merge into it.
- **Never publish:** no CurseForge or Modrinth upload, no published GitHub release, no public
  repo switch without Vlad. Tags and draft releases only when he says so.
- **Formatting:** dates are absolute, estimates carry `[est]`, decisions record who made them and
  when.
