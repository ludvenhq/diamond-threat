# The rules

Diamond Threat has one idea: **the diamonds you carry make the monsters around you bigger.** This
page is the exact rule set. The numbers are the current defaults; they are tuned in playtests and
can change before 1.0, and every change is listed in the [changelog](../CHANGELOG.md).

## Worth

Your **worth** is the diamond value of everything you carry:

| Item                  | Worth |
| --------------------- | ----: |
| Diamond               |     1 |
| Block of diamond      |     9 |
| Diamond ore           |     1 |
| Deepslate diamond ore |     1 |
| Diamond sword         |     2 |
| Diamond pickaxe       |     3 |
| Diamond axe           |     3 |
| Diamond shovel        |     1 |
| Diamond hoe           |     2 |
| Diamond helmet        |     5 |
| Diamond chestplate    |     8 |
| Diamond leggings      |     7 |
| Diamond boots         |     4 |
| Enchanting table      |     2 |
| Jukebox               |     1 |

Gear counts at its recipe cost, so crafting your diamonds into a block, a chestplate or an
enchanting table does not hide them, and ore mined with Silk Touch counts as the diamond inside it.
Netherite gear does not count.

**What counts** is what you carry: the main inventory, the hotbar, the armour slots, the offhand,
and the contents of any shulker box or bundle you carry, however deeply nested.

**What does not count** is anything in the world. A chest, a barrel or a shulker box placed on the
ground is safe, and so is your ender chest. The ender chest is the stash you can reach from
anywhere; a chest is the stash you have to walk away from.

## Size

Every hostile mob near you is scaled by your worth plus the worth it has eaten (see
[Drop and eat](#drop-and-eat)):

```
scale = clamp(1 + (your worth + eaten worth) / 8, 1, 4)
```

At 8 worth, one good vein of diamonds, a zombie is twice its size; at 24 it is four times its size,
about eight blocks tall. That is the cap.

**Hostile** means every mob in the vanilla monster category except the bosses: the warden, the
ender dragon, the wither and the elder guardian never grow. Neutral monsters (endermen, piglins,
zombified piglins, spiders by day) grow too and stay neutral until provoked.

## Room to grow

A mob never grows bigger than the space around it. It has to fit both up and across:

```
scale <= headroom / mob height   (clear blocks above the mob, measured up to 8)
scale <= width / mob width       (clear width on the narrower horizontal axis, measured up to 5)
```

A zombie is 1.95 blocks tall and 0.6 wide. In a two-high tunnel it stays normal size and grows
the moment it follows you into a cavern; in a two-wide ravine it grows to about x3.3 and no more.
Because room is measured only 8 blocks up, a tall mob stops early even in the open: an enderman
reaches about x2.7. Scale moves in steps of 1/16; one diamond is x0.125.

## What growing does

| Stat                 | At scale `s`                                 |
| -------------------- | -------------------------------------------- |
| Size                 | `s` times normal                             |
| Max health           | `base × s × s`, healed to full when it grows |
| Attack damage        | `base × s` (mobs that have an attack)        |
| Knockback resistance | `min(1, (s − 1) / 3)`                        |
| Suffocation          | ignored above scale 1.5                      |

When a mob shrinks, its health is capped to the new maximum and never raised. Arrows, fireballs
and creeper explosions are vanilla: a giant skeleton is harder to kill, not a better shot.

## When mobs change

- A hostile that spawns takes the worth of the nearest player within 64 blocks. It arrives at its
  size without a roar.
- When your worth changes, every hostile within 48 blocks of you re-scales. A mob that actually
  grows roars and bursts with particles; a mob held back by the room around it stays quiet. A mob
  roars at most once every two seconds; the particles show on every growth.
- A sweep every second catches anything the events missed, including a mob that walks out of a
  tunnel into room to grow.
- Room only ever holds growth back. A mob shrinks when worth drops, never because the space around
  it is tight: if it fits where it stands, it keeps its size.

## Drop and eat

Dropping an item with diamond worth lowers your worth, so the mobs around you shrink.

But a hostile that comes within one block of a dropped item with diamond worth **eats it**: the
item disappears and its worth becomes part of that mob for good. Eaten worth adds to your worth
when the mob is scaled, wherever it wanders. A thrown chestplate feeds a mob eight worth.

So the drop only helps until a mob reaches it. Throw your diamonds where mobs cannot get to them,
or into lava.

When a mob that has eaten dies, it drops exactly the items it ate, so you can win them back. A mob
that despawns takes what it ate with it, just like a dropped item that despawns.

## On screen

- **Boss bar:** `THREAT x2.5 ◆ 12`, your scale multiplier and your worth. The bar fills to 24, the
  worth where scale caps, in six notches of x0.5. It is green below x2, yellow below x3 and red
  from x3. A mob that has eaten is bigger than the bar says.
- **Action bar** when your worth goes up: `+1 ◆ mobs grow`, with the worth gained.

Nothing else is added to the screen.

## Multiplayer

Worth is per player, and a mob takes the worth of the nearest player. This is built for a few
friends on a server or a Realm, not for a server with dozens of players.

## Commands

For testing and filming; they need operator permission (level 2).

| Command                        | What it does                                                                |
| ------------------------------ | --------------------------------------------------------------------------- |
| `/threat set <player> <worth>` | Adds a worth offset to the player until cleared; the boss bar shows the sum |
| `/threat clear <player>`       | Removes the offset                                                          |
| `/threat apply`                | Re-scales every hostile now                                                 |
