# Store listings

The CurseForge and Modrinth project pages, field by field. DRAFT, 2026-10-13: checked and
submitted on launch day from the `ludvenhq` accounts. The project description for both
is [description.md](description.md); the per-version fields are in
[docs/releasing.md](../docs/releasing.md).

## Both platforms

| Field       | Value                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Name        | Diamond Threat                                                                                                                     |
| Slug / URL  | `diamond-threat` (check it is free when creating the project)                                                                      |
| Summary     | Minecraft, but the diamonds you carry make the monsters bigger. Drop them and they shrink, until a mob eats them. (113 characters) |
| Description | [description.md](description.md), without its comment block                                                                        |
| License     | MIT                                                                                                                                |
| Source      | https://github.com/ludvenhq/diamond-threat                                                                                         |
| Issues      | https://github.com/ludvenhq/diamond-threat/issues                                                                                  |
| Icon        | `listing/icon.png`, 512 by 512 (to make before launch)                                                                             |

## Modrinth

| Field        | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Project type | Mod                                                   |
| Categories   | Game Mechanics, Mobs (featured); Adventure            |
| Client side  | Required                                              |
| Server side  | Required                                              |
| Dependencies | Set per version: KubeJS required, KubeLoader required |
| Monetization | Creator monetization on (Settings, Monetization)      |
| Gallery      | The launch screenshots; one marked featured           |

Modrinth reviews new projects before they go public, so submit a day ahead if possible.

Created 2026-10-14 from the ludvenhq account: project 28qnQZfY,
https://modrinth.com/mod/diamond-threat. Summary, description, MIT, source and issues links, categories
(game-mechanics, mobs; adventure), icon, gallery (grow.gif featured plus the three screenshots), version
vH26o5bL "Diamond Threat 0.1.0" (Release, NeoForge 1.21.1, client and server required, KubeJS umyGl7zF
and KubeLoader Q6dKnkVg required, the release jar: sha512 77ced874...). Disclosure "Contains
AI-generated content" is on: the mod's code is written with Claude, and Modrinth's rules require it
for a substantial amount of AI-generated code. Submitted for review the same day. The version
upload dropzone has no file input, so the jar was handed to it as a drop event.

## CurseForge

Created 2026-10-14 from the ludvenhq account: project 1744381,
https://www.curseforge.com/minecraft/mc-mods/diamond-threat. General, description, MIT, third-party
distribution allowed, GitHub source, default relations (KubeJS and KubeLoader required) and media are
set. File 9170925, "Diamond Threat 0.1.0" (the release jar, sha256 8498ad33...), Beta, 1.21.1,
NeoForge, Java 21, client and server, uploaded 2026-10-14: moderation started. Switched from Beta to
Release the same day: CurseForge hides Beta files unless players turn on the Beta filter. The logo cropper takes a 400 by 400 box at 1:1, so
it gets `icon-400.png`; images are capped at 2 MB, so the gallery has `grow-small.gif`.

| Field         | Value                                              |
| ------------- | -------------------------------------------------- |
| Class         | Mods                                               |
| Main category | Mobs                                               |
| Categories    | Adventure and RPG (check the list on the day)      |
| Dependencies  | Set per file: KubeJS required, KubeLoader required |
| Rewards       | Opt the project into CurseForge Rewards            |
| Images        | The launch screenshots and the GIF                 |

CurseForge does not allow donation links or external download links on the project page; the
description has neither.

## Assets for launch day

- [x] `icon.png`, 512 by 512: a pixel zombie face, a diamond and the red THREAT bar, on the hub's night colours (2026-10-14)
- [x] `grow.gif`, 5 seconds, 560 by 315, 3.9 MB: a zombie villager grows the moment 11 diamonds are picked up, the bar goes from x1 to x2.4 (the first playtest recording, 2026-10-14, 1:37-1:42)
- [x] Three screenshots at 1920 by 1080 in `screenshots/`: `giant-in-a-cave.jpg` (bar at x1, a zombie
      that ate the diamonds twice the size of the one in front), `zombie-eats-a-diamond.jpg`,
      `threat-bar-red.jpg` (x4 at night, a giant beside the chest); the hub uses the same three
- [ ] The first short, once posted, linked from the description once it is up
