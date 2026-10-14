<!--
The project description for CurseForge and Modrinth (both take Markdown). DRAFT, 2026-10-13:
written ahead of launch, so every claim must be true of the release build before it is posted.
The media slots marked MEDIA are filled from the first clip's footage on launch day.
-->

# Diamond Threat

**Minecraft, but the diamonds you carry make the monsters bigger.**

<!-- MEDIA: a GIF, a zombie growing as the player picks up diamonds, the THREAT bar filling -->

Every diamond in your inventory feeds the hostile mobs around you. Pick up one and they grow. Carry
a stack and a zombie stands eight blocks tall. Drop your diamonds and they shrink again, until a mob
walks over them, eats them, and keeps the size for good.

So what do you do with your diamonds?

## How it works

- **Worth.** A diamond is worth 1, a block of diamond 9, diamond gear its recipe cost. Everything
  you carry counts, shulker boxes and bundles included. Crafting does not hide anything.
- **Size.** Hostile mobs near you grow with your worth, up to four times their size at 24, with
  more health, more damage and more knockback resistance. They never grow bigger than the room
  around them, so a cave tunnel keeps them small until they follow you into a cavern.
- **Drop and eat.** Dropping diamonds shrinks the mobs. But a mob that reaches a dropped diamond
  item eats it and grows. Kill it and you get your diamonds back. Throw them into lava and nobody
  does.
- **Stashes.** Your ender chest and any chest in the world are safe. The ender chest is the only
  stash that travels with you.
- **On screen.** One boss bar, `THREAT x2.5 ◆ 12`, and a message each time your worth goes up.
  Nothing else, so it films clean.

<!-- MEDIA: a screenshot, the THREAT bar in red over a giant zombie in a cavern -->

Bosses never grow: the warden, the ender dragon, the wither and the elder guardian stay as they
are. Endermen, piglins and spiders do grow, and stay neutral until you provoke them.

## Install

The easiest way: install Diamond Threat with the CurseForge app or the Modrinth App into a NeoForge
1.21.1 profile. The app adds KubeJS and KubeLoader with it.

| Needs          | Version                     |
| -------------- | --------------------------- |
| Minecraft Java | 1.21.1                      |
| NeoForge       | 21.1.199 or newer           |
| KubeJS         | 2101.7.2-build.374 or newer |
| KubeLoader     | 21-0.1.0-Alpha-3 or newer   |

**Servers:** install the same mods on the server and on every player's game.

**Check it works:** in a world with cheats on, run `/threat test`. A zombie four times its size
appears in front of you with a red THREAT bar. `/threat test clear` removes them.

## Commands

All need operator permission.

| Command                        | What it does                                   |
| ------------------------------ | ---------------------------------------------- |
| `/threat test`                 | Checks the install: a giant zombie and the bar |
| `/threat test clear`           | Removes them                                   |
| `/threat set <player> <worth>` | Adds worth to a player, for testing or filming |
| `/threat clear <player>`       | Removes it                                     |
| `/threat apply`                | Re-scales every hostile mob now                |

## Questions

**Can I use it in a video or a modpack?** Yes, please. It is MIT licensed; a link back is
appreciated.

**Does it work on Forge, Fabric, Bedrock or other versions?** No: NeoForge on Minecraft 1.21.1
only.

**Something is wrong.** Open an issue on GitHub with your versions and `logs/kubejs/server.log`
from your game folder.

The full rules and numbers: [docs/rules.md](https://github.com/ludvenhq/diamond-threat/blob/main/docs/rules.md).

---

Made by [Ludven](https://ludven.com), a small studio building tiny apps and games in public.
Source code on [GitHub](https://github.com/ludvenhq/diamond-threat). Not an official Minecraft
product; not approved by or associated with Mojang or Microsoft.
