# Architecture

Diamond Threat is game logic written in TypeScript, compiled into one KubeJS server script and
shipped as a NeoForge mod jar through KubeLoader. This page explains each step and why it is
built that way.

## The pipeline

```
src/*.ts
   │  esbuild: bundle into one function-wrapped script, target ES2019
   │  (lowers ?. ?? ||=, replaces __VERSION__)
   ▼
Rhino syntax gate (scripts/lib/rhino-syntax.ts)
   │  refuses to write a bundle release Rhino would reject
   ▼
build/contentpack/
   ├── contentpack.json
   └── server_scripts/diamond-threat.js ──▶ linked into a game instance for development
   │
   ├──▶ npm run check:rhino   the bundle on Rhino 81, 85 and 91: test/rhino/scenario.js drives the
   │                          handlers, test/rhino/core-scenario.js calls the pure rules
   ▼
npm run pack
   ▼
dist/
   ├── diamond-threat-<version>.jar   the mod
   ├── diamond-threat-<version>.js    the same script, for a plain kubejs/server_scripts/ folder
   └── SHA256SUMS
   │
   └──▶ npm run check:jar   the jar read with Java's jar and zip readers, as the game reads it
```

## How the game runs it

- **KubeJS** loads every server script when a world opens and on every `/reload`. All server
  scripts share one scope, so a top-level `const` in one script clashes with the same name in
  another. The bundle is one function call, so it declares nothing at the top level; the syntax
  gate enforces that.
- **Event handlers** can only be registered while scripts load. `main.ts` calls each
  `register...` function once per load, and `/reload` drops the old handlers before the new load.
- **KubeLoader** finds the pack in two places: inside a mod jar (`contentpacks/contentpack.json`
  plus `contentpacks/server_scripts/`), and as a folder in `kubejs/contentpacks/<id>/` for
  development. Both run the same script.
- **KubeLoader's script transformer** (`useModernJS`, on by default) rewrites modern syntax in
  every script it loads. The bundle contains none, so there is nothing for it to rewrite; the
  bundle is built to run with the transformer off too.

## Rhino

KubeJS 7 runs scripts on its own fork of [Rhino](https://github.com/kube-mods/rhino). In October
2026 the release on CurseForge and Modrinth is `2101.2.7-build.85`, KubeJS accepts builds from
`2101.2.7-build.81`, and `2101.2.8-build.91` is a beta. The release builds support much less
syntax than the beta. Results from running test cases on each build:

| Syntax or feature                                                            |            81 and 85 (release)            | 91 (beta) |
| ---------------------------------------------------------------------------- | :---------------------------------------: | :-------: |
| `let`, `const`, arrow functions, template literals                           |                    yes                    |    yes    |
| Destructuring without defaults, including shorthand `{ a } = o`              |                    yes                    |    yes    |
| `for...of` over arrays and Java lists and sets                               |                    yes                    |    yes    |
| `Map`, `Set`, generators, `Symbol`, getters and setters, `**`                |                    yes                    |    yes    |
| `Object.assign`, `Array.prototype.includes` and `find`                       |                    yes                    |    yes    |
| Shorthand properties in objects `{ a }`, computed keys                       |                    no                     |    yes    |
| Default parameters, defaults in destructuring, rest parameters               |                    no                     |    yes    |
| `?.`                                                                         | broken (does not short-circuit the chain) |    yes    |
| `??`                                                                         |        broken (`null ?? 5` is `0`)        |    yes    |
| `Promise`, `globalThis`, `Object.fromEntries`, `.at`, `.flat`                |                    no                     |    yes    |
| Spread, rest in destructuring, `class`, `async`, `Proxy`, `Reflect`, `\|\|=` |                    no                     |    no     |

Also on every build: `var` is block-scoped, reassigning a `const` is silently ignored, closures
made in a `for (let ...)` loop all see the last value, and `JSON.stringify({ a: 1 })` gives
`{"a":1.0}`.

A `const` is only safe at the top of a function body and in a loop's head
(`for (const x of xs)`). Inside any other block it breaks on every build (found 2026-10-13, when
the game glue first ran on Rhino): in a loop body it keeps its first value on every pass, so a
loop over 41 inventory slots counted the first slot 41 times, and in an `if` block that also
makes a closure, the function's second call throws `redeclaration of var`. `let` works in both
places, so `src/` uses `let` inside blocks, and the lint rule and the syntax gate both refuse a
`const` there.

So the code targets the release builds. Four layers keep it inside that subset:

1. **Types:** `tsconfig.json` gives `src/` only the ES2015 library plus `Array.prototype.includes`,
   so `Object.fromEntries` or `.at()` do not type-check.
2. **Lint:** `eslint.config.mjs` bans the unsupported syntax in `src/` with a message at the line.
3. **esbuild** lowers `?.`, `??` and logical assignment, which it can. It cannot lower the rest,
   and it is told (`supported` in `scripts/lib/bundle.ts`) never to generate it: left alone, it
   prints `{ id: id }` as the shorthand `{ id }`, which release Rhino rejects.
4. **The syntax gate** parses the built bundle and refuses anything on the list, whatever wrote
   it. Then the Rhino check runs the bundle on the real builds.

### Why not compile TypeScript to ES5

ES5 output would sidestep most of this, but every route is closed: TypeScript 6 deprecates the
ES5 target and TypeScript 7 removes it; esbuild cannot lower to ES5; and TypeScript's own ES5
helpers (`__spreadArray` and the `downlevelIteration` helpers) fail on Rhino, because of the
block-scoped `var`. Writing in the supported subset is simpler and the output stays readable.

## The KubeJS API

`src/kubejs/kubejs.d.ts` types, by hand, only the part of the KubeJS API the scripts use. ProbeJS
generates typings for the whole game, but they are written for plain JavaScript (its own output
says fully TypeScript-compatible typings are not possible), they are very large, and they only
exist inside a game folder, so CI could not use them. KubeJS exposes its `kjs$getFoo()` extension
methods and Java bean getters as properties: `entity.type`, `entity.persistentData`,
`source.player`.

KubeJS also renames and hides vanilla methods for scripts, with `@RemapForJS` and `@HideFromJS`
on its mixins (`dev.latvian.mods.kubejs.core.mixin`). In KubeJS 2101.7.2, `Entity#getStringUUID`
is `getStringUuid`, `Entity#level()` and `Level#players()` are hidden behind KubeJS's `level` and
`players` properties, `Level#getGameTime` is `getTime`, and `DamageSource#getMsgId` is
`getType()` (while `type` is vanilla's `type()` record). A plain Rhino has no mixins and sees the
vanilla names, which is how the first in-game run (2026-10-13) failed with "Cannot find function
getStringUUID" after every check had passed. So every zero-argument read goes through `read()` in
`src/java.ts`, which takes candidate names, KubeJS's first, and logs once per load which name
answered (`Diamond Threat interop:` lines in `logs/kubejs/server.log`). The typings in
`src/kubejs/kubejs.d.ts` leave those members out, so a direct call does not compile, and the
Rhino check's fakes use KubeJS's names, not vanilla's.

## The jar

```
META-INF/neoforge.mods.toml       modLoader "lowcodefml": a mod with no Java code
pack.mcmeta                       pack format 34 (1.21.1), accepted up to 48
LICENSE
contentpacks/contentpack.json     KubeLoader's pack metadata
contentpacks/server_scripts/diamond-threat.js
```

All metadata comes from `package.json`: the version, the description, and the `mod` section with
the mod id and the dependency ranges. Every dependency is declared required, so the CurseForge app
and the Modrinth App install KubeJS and KubeLoader with it. The jar is written by
`scripts/lib/zip.ts` with a fixed timestamp and order, so the same source always gives the same
bytes and `SHA256SUMS` identifies a build.

KubeLoader can export a jar from inside the game (`/kl mod`), but its generated metadata uses the
legacy `mandatory` key, so this project writes its own.

## Known limits

- The Rhino check runs a plain Rhino context, not KubeJS's. Java interop (a string id turned into
  an attribute holder, Java collections) is only proven in the game.
- KubeLoader is an alpha, and Modrinth carries an older build of it (Alpha-3) than CurseForge
  (Alpha-7). The jar declares `[21-0.1.0-Alpha-3,)` so both platforms resolve.
- Minecraft 1.21.1 only: the scale attribute is `minecraft:generic.scale` there and was renamed in
  1.21.2. It is one constant in `src/config.ts`.
