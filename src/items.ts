import { MAX_NESTING } from './config.ts';
import { isContainerItem, type Stack } from './worth.ts';

/** The vanilla component types for shulker box and bundle contents; null if KubeJS refused them. */
let components: DataComponentsClass | null = null;

/**
 * Loads net.minecraft DataComponents once per script load. If KubeJS refuses the class, worth
 * still counts everything except what is inside shulker boxes and bundles, and the log says so.
 */
export function loadComponents(): void {
  try {
    components = Java.loadClass('net.minecraft.core.component.DataComponents');
  } catch (error) {
    components = null;
    console.warn(
      `Diamond Threat: cannot open shulker boxes and bundles, their contents will not count (${String(error)})`,
    );
  }
}

function addAll(into: Stack[], items: JavaIterable<ItemStack>, depth: number): void {
  const iterator = items.iterator();
  while (iterator.hasNext()) {
    into.push(toStack(iterator.next(), depth));
  }
}

let contentsWarned = false;

/**
 * A game item stack as the rules see it, with the contents of shulker boxes and bundles. If the
 * contents cannot be read, the container counts as empty and the log says so once.
 */
export function toStack(item: ItemStack, depth: number): Stack {
  const id = item.getId();
  const contents: Stack[] = [];
  if (components !== null && depth < MAX_NESTING && isContainerItem(id)) {
    try {
      let container = item.get(components.CONTAINER);
      if (container !== null) addAll(contents, container.nonEmptyItems(), depth + 1);
      let bundle = item.get(components.BUNDLE_CONTENTS);
      if (bundle !== null) addAll(contents, bundle.items(), depth + 1);
    } catch (error) {
      contents.length = 0;
      if (!contentsWarned) {
        contentsWarned = true;
        console.warn(`Diamond Threat: cannot read what ${id} holds (${String(error)})`);
      }
    }
  }
  return { id: id, count: item.getCount(), contents: contents };
}

/** Everything the player carries: inventory, hotbar, armour, offhand, and the cursor. */
export function carriedStacks(player: KubePlayer): Stack[] {
  const stacks: Stack[] = [];
  const inventory = player.getInventory();
  const size = inventory.getContainerSize();
  for (let slot = 0; slot < size; slot++) {
    let item = inventory.getItem(slot);
    if (!item.isEmpty()) stacks.push(toStack(item, 0));
  }
  const carried = player.containerMenu.getCarried();
  if (!carried.isEmpty()) stacks.push(toStack(carried, 0));
  return stacks;
}

/** The stack as SNBT, with its enchantments and contents, to drop back later. */
export function saveStack(item: ItemStack, level: KubeLevel): string {
  return String(item.save(level.registryAccess()));
}
