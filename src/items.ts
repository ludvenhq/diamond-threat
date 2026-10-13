import { MAX_NESTING } from './config.ts';
import {
  carriedOf,
  forEachStack,
  inventoryItem,
  inventorySize,
  isEmptyStack,
  read,
  registriesOf,
  stackCount,
  stackId,
} from './java.ts';
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

let contentsWarned = false;

/**
 * A game item stack as the rules see it, with the contents of shulker boxes and bundles. If the
 * contents cannot be read, the container counts as empty and the log says so once.
 */
export function toStack(item: ItemStack, depth: number): Stack {
  const id = stackId(item);
  const contents: Stack[] = [];
  const addInner = (inner: ItemStack): void => {
    contents.push(toStack(inner, depth + 1));
  };
  if (components !== null && depth < MAX_NESTING && isContainerItem(id)) {
    try {
      let container = item.get(components.CONTAINER);
      if (container !== null) forEachStack(read(container, ['nonEmptyItems']) as object, addInner);
      let bundle = item.get(components.BUNDLE_CONTENTS);
      if (bundle !== null) forEachStack(read(bundle, ['items']) as object, addInner);
    } catch (error) {
      contents.length = 0;
      if (!contentsWarned) {
        contentsWarned = true;
        console.warn(`Diamond Threat: cannot read what ${id} holds (${String(error)})`);
      }
    }
  }
  return { id: id, count: stackCount(item), contents: contents };
}

/** Everything the player carries: inventory, hotbar, armour, offhand, and the cursor. */
export function carriedStacks(player: KubePlayer): Stack[] {
  const stacks: Stack[] = [];
  const size = inventorySize(player);
  for (let slot = 0; slot < size; slot++) {
    let item = inventoryItem(player, slot);
    if (!isEmptyStack(item)) stacks.push(toStack(item, 0));
  }
  const carried = carriedOf(player);
  if (!isEmptyStack(carried)) stacks.push(toStack(carried, 0));
  return stacks;
}

/** The stack as SNBT, with its enchantments and contents, to drop back later. */
export function saveStack(item: ItemStack, level: KubeLevel): string {
  return String(item.save(registriesOf(level)));
}
