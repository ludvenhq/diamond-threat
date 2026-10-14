/**
 * The part of the KubeJS 7 server API that Diamond Threat uses, typed by hand.
 *
 * ProbeJS generates typings for the whole game, but they are written for plain JS (its own output
 * says fully TypeScript-compatible typings are not possible) and they are tens of thousands of
 * lines that only exist in a game folder, not in CI. So the game scripts see only this small,
 * strict surface. Each entry names the Java method it maps to. When you need something new, check
 * it in ProbeJS or the KubeJS source (https://github.com/kube-mods/kubejs/tree/2101) and add it.
 *
 * Only members that take arguments, and KubeJS's own properties that the game has proven, are
 * typed here. Every zero-argument read (a uuid, a position, a list's size, a block state) goes
 * through read() in src/java.ts, because in the game some vanilla zero-argument methods are not
 * callable and a KubeJS property can shadow a vanilla method of the same name.
 */

/** A Minecraft text component. Plain strings are converted by KubeJS. */
type TextLike = string;

/** java.util.List. Its size is read with listSize() in src/java.ts. */
interface JavaList<T> {
  get(index: number): T;
}

/** A Java Set<String>, as Rhino exposes it. */
interface JavaStringSet {
  contains(value: string): boolean;
}

/** net.minecraft.nbt.CompoundTag, through KubeJS's `persistentData`. Missing keys read as 0 or ''. */
interface CompoundTag {
  contains(key: string): boolean;
  getDouble(key: string): number;
  putDouble(key: string, value: number): void;
  getInt(key: string): number;
  putInt(key: string, value: number): void;
  getString(key: string): string;
  putString(key: string, value: string): void;
  remove(key: string): void;
}

/** net.minecraft.nbt.Tag: its string is SNBT, which commands read back. */
interface NbtTag {
  toString(): string;
}

/** net.minecraft.core.RegistryAccess, a HolderLookup.Provider for saving items. */
interface RegistryAccess {
  readonly kind?: 'RegistryAccess';
}

/** net.minecraft.core.component.DataComponentType<T> */
interface DataComponentType<T> {
  readonly value?: T;
}

/** net.minecraft.world.item.component.ItemContainerContents: its items via `nonEmptyItems`. */
interface ItemContainerContents {
  readonly kind?: 'ItemContainerContents';
}

/** net.minecraft.world.item.component.BundleContents: its items via `items`. */
interface BundleContents {
  readonly kind?: 'BundleContents';
}

/** net.minecraft.core.component.DataComponents, loaded with Java.loadClass. */
interface DataComponentsClass {
  readonly CONTAINER: DataComponentType<ItemContainerContents>;
  readonly BUNDLE_CONTENTS: DataComponentType<BundleContents>;
}

/** ItemStack with ItemStackKJS. Its id, count and emptiness are read in src/java.ts. */
interface ItemStack {
  /** DataComponentHolder#get: null when the stack does not have the component. */
  get<T>(type: DataComponentType<T>): T | null;
  /** ItemStack#save(HolderLookup.Provider): the stack with its components, as NBT. */
  save(registries: RegistryAccess): NbtTag;
}

/** net.minecraft.world.entity.player.Inventory: 36 slots, then armour, then the offhand. */
interface Inventory {
  getItem(slot: number): ItemStack;
}

/** dev.latvian.mods.kubejs.level.LevelBlock: its block state is read in src/java.ts. */
interface LevelBlock {
  readonly kind?: 'LevelBlock';
}

/** net.minecraft.world.phys.AABB */
interface AABB {
  inflate(amount: number): AABB;
}

/** ServerLevel with LevelKJS and EntityGetterKJS. Players, dimension and time: src/java.ts. */
interface KubeLevel {
  /** kjs$getBlock(int, int, int) */
  getBlock(x: number, y: number, z: number): LevelBlock;
  /** kjs$getEntitiesWithin: every entity touching the box. */
  getEntitiesWithin(box: AABB): JavaList<KubeEntity>;
}

/** MinecraftServer with MinecraftServerKJS. Its players are read in src/java.ts. */
interface KubeServer {
  /** kjs$runCommandSilent: runs a command as the server, without chat output. */
  runCommandSilent(command: string): void;
  /** kjs$tell: a chat message to every player. */
  tell(message: TextLike): void;
}

/**
 * Entity with EntityKJS. The uuid, type, level, position, hitbox, tags and flags are read in
 * src/java.ts.
 */
interface KubeEntity {
  /** kjs$getPersistentData: KubeJS's own tag on the entity, saved with it. */
  readonly persistentData: CompoundTag;
  /** kjs$getServer */
  readonly server: KubeServer;
  /** kjs$tell */
  tell(message: TextLike): void;
}

/** ItemEntity with ItemEntityKJS: a dropped item. Its stack is read with itemOf(). */
interface KubeItemEntity extends KubeEntity {
  readonly kind?: 'ItemEntity';
}

/** LivingEntity with LivingEntityKJS. Health is read in src/java.ts. */
interface KubeLivingEntity extends KubeEntity {
  /**
   * kjs$setAttributeBaseValue. KubeJS converts the attribute id string to a Holder<Attribute>.
   * Does nothing when the mob does not have the attribute.
   */
  setAttributeBaseValue(attribute: string, value: number): void;
  /** kjs$getAttributeBaseValue: 0 when the mob does not have the attribute. */
  getAttributeBaseValue(attribute: string): number;
  /** kjs$getAttributeTotalValue: with modifiers; 0 when the mob does not have the attribute. */
  getAttributeTotalValue(attribute: string): number;
  setHealth(health: number): void;
}

/** ServerPlayer with PlayerKJS. Its inventory is read in src/java.ts. */
interface KubePlayer extends KubeLivingEntity {
  /** kjs$getUsername */
  readonly username: string;
  /** kjs$setStatusMessage: the action bar text above the hotbar. */
  setStatusMessage(message: TextLike): void;
}

/** net.minecraft.world.damagesource.DamageSource: its message id is read in src/java.ts. */
interface DamageSource {
  readonly kind?: 'DamageSource';
}

/** net.minecraft.commands.CommandSourceStack */
interface CommandSource {
  /** getPlayer: null when the command did not come from a player. */
  readonly player: KubePlayer | null;
  readonly server: KubeServer;
  hasPermission(level: number): boolean;
}

/** com.mojang.brigadier.context.CommandContext */
interface CommandContext {
  readonly source: CommandSource;
}

/** A Brigadier argument type, made by an ArgumentTypeWrapper. */
interface ArgumentType {
  readonly kind?: 'ArgumentType';
}

/** dev.latvian.mods.kubejs.command.ArgumentTypeWrappers, one constant per argument type. */
interface ArgumentTypeWrapper<T> {
  create(event: CommandRegistryEvent): ArgumentType;
  getResult(context: CommandContext, name: string): T;
}

interface ArgumentTypes {
  /** EntityArgument.player() */
  readonly PLAYER: ArgumentTypeWrapper<KubePlayer>;
  /** IntegerArgumentType.integer(); the result is a java.lang.Integer, read it with Number(). */
  readonly INTEGER: ArgumentTypeWrapper<unknown>;
}

/** com.mojang.brigadier.builder.ArgumentBuilder: a literal or an argument node. */
interface CommandBuilder {
  requires(predicate: (source: CommandSource) => boolean): CommandBuilder;
  then(child: CommandBuilder): CommandBuilder;
  /** The callback returns the command's result count; 1 means success. */
  executes(run: (context: CommandContext) => number): CommandBuilder;
}

/** net.minecraft.commands.Commands, wrapped by KubeJS. */
interface Commands {
  literal(name: string): CommandBuilder;
  argument(name: string, type: ArgumentType): CommandBuilder;
}

/** dev.latvian.mods.kubejs.command.CommandRegistryKubeEvent */
interface CommandRegistryEvent {
  readonly commands: Commands;
  readonly arguments: ArgumentTypes;
  register(command: CommandBuilder): void;
}

/** dev.latvian.mods.kubejs.entity.EntitySpawnedKubeEvent (EntityJoinLevelEvent) */
interface EntitySpawnedEvent {
  readonly entity: KubeEntity;
  readonly level: KubeLevel;
}

/** dev.latvian.mods.kubejs.entity.LivingEntityDeathKubeEvent */
interface EntityDeathEvent {
  readonly entity: KubeLivingEntity;
}

/** dev.latvian.mods.kubejs.entity.BeforeLivingEntityHurtKubeEvent (LivingDamageEvent.Pre) */
interface BeforeHurtEvent {
  readonly entity: KubeLivingEntity;
  readonly source: DamageSource;
  /** Cancels the damage. Works by throwing, so never call it inside try/catch. */
  cancel(): void;
}

/** dev.latvian.mods.kubejs.player.InventoryChangedKubeEvent */
interface InventoryChangedEvent {
  readonly player: KubePlayer;
}

/** dev.latvian.mods.kubejs.server.ServerKubeEvent */
interface ServerTickEvent {
  readonly server: KubeServer;
}

declare const ServerEvents: {
  commandRegistry(handler: (event: CommandRegistryEvent) => void): void;
  /** Once per server tick, 20 times a second. */
  tick(handler: (event: ServerTickEvent) => void): void;
};

declare const EntityEvents: {
  /** Fires when any entity joins a level, including chunk loads. */
  spawned(handler: (event: EntitySpawnedEvent) => void): void;
  /** Fires before a living entity dies. */
  death(handler: (event: EntityDeathEvent) => void): void;
  /** Fires before a living entity takes damage. */
  beforeHurt(handler: (event: BeforeHurtEvent) => void): void;
};

declare const PlayerEvents: {
  /** Fires when a slot of a player's inventory changes. */
  inventoryChanged(handler: (event: InventoryChangedEvent) => void): void;
};

/** KubeJS's Java access. Refuses classes on its deny list by throwing. */
declare const Java: {
  loadClass(name: 'net.minecraft.core.component.DataComponents'): DataComponentsClass;
};

/** KubeJS's ConsoleJS; output goes to logs/kubejs/server.log. */
declare const console: {
  info(...values: unknown[]): void;
  warn(...values: unknown[]): void;
  error(...values: unknown[]): void;
};

/** Replaced at build time with the version from package.json. */
declare const __VERSION__: string;
