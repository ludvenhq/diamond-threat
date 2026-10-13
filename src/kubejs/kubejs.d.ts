/**
 * The part of the KubeJS 7 server API that Diamond Threat uses, typed by hand.
 *
 * ProbeJS generates typings for the whole game, but they are written for plain JS (its own output
 * says fully TypeScript-compatible typings are not possible) and they are tens of thousands of
 * lines that only exist in a game folder, not in CI. So the game scripts see only this small,
 * strict surface. Each entry names the Java method it maps to; KubeJS exposes `kjs$getFoo()` as
 * `foo` and Java bean getters as properties. When you need something new, check it in ProbeJS or
 * the KubeJS source (https://github.com/kube-mods/kubejs/tree/2101) and add it here.
 *
 * Where a KubeJS property and a vanilla method share a name (`level`, `type`), the scripts call
 * the vanilla method explicitly (`entity.level()`), so Rhino's choice between them never matters.
 */

/** A Minecraft text component. Plain strings are converted by KubeJS. */
type TextLike = string;

/** java.util.List, as Rhino exposes it. */
interface JavaList<T> {
  size(): number;
  get(index: number): T;
}

/** java.util.Iterator */
interface JavaIterator<T> {
  hasNext(): boolean;
  next(): T;
}

/** java.lang.Iterable */
interface JavaIterable<T> {
  iterator(): JavaIterator<T>;
}

/** A Java Set<String>, as Rhino exposes it. */
interface JavaStringSet {
  contains(value: string): boolean;
  size(): number;
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

/** net.minecraft.nbt.Tag: its toString is SNBT, which commands read back. */
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

/** net.minecraft.world.item.component.ItemContainerContents: a shulker box's items. */
interface ItemContainerContents {
  nonEmptyItems(): JavaIterable<ItemStack>;
}

/** net.minecraft.world.item.component.BundleContents */
interface BundleContents {
  items(): JavaIterable<ItemStack>;
}

/** net.minecraft.core.component.DataComponents, loaded with Java.loadClass. */
interface DataComponentsClass {
  readonly CONTAINER: DataComponentType<ItemContainerContents>;
  readonly BUNDLE_CONTENTS: DataComponentType<BundleContents>;
}

/** ItemStack with ItemStackKJS. */
interface ItemStack {
  /** kjs$getId: the registry id, for example `minecraft:diamond`. */
  getId(): string;
  getCount(): number;
  isEmpty(): boolean;
  /** DataComponentHolder#get: null when the stack does not have the component. */
  get<T>(type: DataComponentType<T>): T | null;
  /** ItemStack#save(HolderLookup.Provider): the stack with its components, as NBT. */
  save(registries: RegistryAccess): NbtTag;
}

/** net.minecraft.world.entity.player.Inventory: 36 slots, then armour, then the offhand. */
interface Inventory {
  getContainerSize(): number;
  getItem(slot: number): ItemStack;
}

/** net.minecraft.world.inventory.AbstractContainerMenu */
interface ContainerMenu {
  /** The stack held on the cursor while a screen is open. */
  getCarried(): ItemStack;
}

/** net.minecraft.world.level.block.state.BlockState */
interface BlockState {
  /** BlockStateBase#blocksMotion: true for blocks a mob cannot walk through. */
  blocksMotion(): boolean;
}

/** dev.latvian.mods.kubejs.level.LevelBlock */
interface LevelBlock {
  getBlockState(): BlockState;
}

/** net.minecraft.world.phys.AABB */
interface AABB {
  inflate(amount: number): AABB;
}

/** net.minecraft.resources.ResourceLocation */
interface ResourceLocation {
  toString(): string;
}

/** ServerLevel with LevelKJS and EntityGetterKJS. */
interface KubeLevel {
  /** kjs$getBlock(int, int, int) */
  getBlock(x: number, y: number, z: number): LevelBlock;
  /** Level#players: the players in this level. */
  players(): JavaList<KubePlayer>;
  /** kjs$getEntitiesWithin: every entity touching the box. */
  getEntitiesWithin(box: AABB): JavaList<KubeEntity>;
  /** kjs$getDimension, for example `minecraft:overworld`. */
  getDimension(): ResourceLocation;
  registryAccess(): RegistryAccess;
  getGameTime(): number;
}

/** net.minecraft.server.players.PlayerList */
interface PlayerList {
  getPlayers(): JavaList<KubePlayer>;
}

/** MinecraftServer with MinecraftServerKJS. */
interface KubeServer {
  /** kjs$runCommandSilent: runs a command as the server, without chat output. */
  runCommandSilent(command: string): void;
  /** kjs$tell: a chat message to every player. */
  tell(message: TextLike): void;
  /** kjs$getPersistentData: saved with the world. */
  readonly persistentData: CompoundTag;
  getPlayerList(): PlayerList;
}

/** Entity with EntityKJS. */
interface KubeEntity {
  /** kjs$getType: the registry id, for example `minecraft:zombie`. */
  readonly type: string;
  /** kjs$isMonster: true for the vanilla monster category. */
  isMonster(): boolean;
  /** kjs$isLiving */
  isLiving(): boolean;
  isAlive(): boolean;
  /** Entity#getTags: the scoreboard tags. */
  getTags(): JavaStringSet;
  /** kjs$getPersistentData: KubeJS's own tag on the entity, saved with it. */
  readonly persistentData: CompoundTag;
  /** kjs$getServer */
  readonly server: KubeServer;
  getStringUUID(): string;
  level(): KubeLevel;
  getX(): number;
  getY(): number;
  getZ(): number;
  getBoundingBox(): AABB;
  /** The current hitbox, already multiplied by the scale attribute. */
  getBbWidth(): number;
  getBbHeight(): number;
  /** Removes the entity without a death. */
  discard(): void;
  /** kjs$tell */
  tell(message: TextLike): void;
}

/** ItemEntity with ItemEntityKJS: a dropped item. */
interface KubeItemEntity extends KubeEntity {
  getItem(): ItemStack;
}

/** LivingEntity with LivingEntityKJS. */
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
  getHealth(): number;
  setHealth(health: number): void;
  getMaxHealth(): number;
}

/** ServerPlayer with PlayerKJS. */
interface KubePlayer extends KubeLivingEntity {
  /** kjs$getUsername */
  readonly username: string;
  /** kjs$setStatusMessage: the action bar text above the hotbar. */
  setStatusMessage(message: TextLike): void;
  getInventory(): Inventory;
  /** Player#containerMenu: the open screen, or the player's own inventory. */
  readonly containerMenu: ContainerMenu;
}

/** net.minecraft.world.damagesource.DamageSource */
interface DamageSource {
  /** The damage type's message id: `inWall` for suffocation. */
  getMsgId(): string;
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
