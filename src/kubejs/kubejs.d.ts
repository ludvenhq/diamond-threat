/**
 * The part of the KubeJS 7 server API that Diamond Threat uses, typed by hand.
 *
 * ProbeJS generates typings for the whole game, but they are written for plain JS (its own output
 * says fully TypeScript-compatible typings are not possible) and they are tens of thousands of
 * lines that only exist in a game folder, not in CI. So the game scripts see only this small,
 * strict surface. Each entry names the Java method it maps to; KubeJS exposes `kjs$getFoo()` as
 * `foo` and Java bean getters as properties. When you need something new, check it in ProbeJS or
 * the KubeJS source (https://github.com/kube-mods/kubejs/tree/2101) and add it here.
 */

/** A Minecraft text component. Plain strings are converted by KubeJS. */
type TextLike = string;

/** net.minecraft.nbt.CompoundTag, through KubeJS's `persistentData`. */
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

/** A Java Set<String>, as Rhino exposes it. */
interface JavaStringSet {
  contains(value: string): boolean;
  size(): number;
}

/** MinecraftServer with MinecraftServerKJS. */
interface KubeServer {
  /** kjs$runCommandSilent: runs a command as the server, without chat output. */
  runCommandSilent(command: string): void;
  /** kjs$tell: a chat message to every player. */
  tell(message: TextLike): void;
  /** kjs$getPersistentData: saved with the world. */
  readonly persistentData: CompoundTag;
}

/** Entity with EntityKJS. */
interface KubeEntity {
  /** kjs$getType: the registry id, for example `minecraft:zombie`. */
  readonly type: string;
  /** kjs$isMonster: true for every category that is not friendly (the vanilla monster category). */
  readonly monster: boolean;
  /** Entity#getTags: the scoreboard tags. */
  readonly tags: JavaStringSet;
  /** kjs$getPersistentData: KubeJS's own tag on the entity, saved with it. */
  readonly persistentData: CompoundTag;
  /** kjs$getServer */
  readonly server: KubeServer;
  /** Entity#getStringUUID */
  readonly stringUUID: string;
  /** kjs$tell */
  tell(message: TextLike): void;
}

/** LivingEntity with LivingEntityKJS. */
interface KubeLivingEntity extends KubeEntity {
  /**
   * kjs$setAttributeBaseValue. KubeJS converts the attribute id string to a Holder<Attribute>.
   * On 1.21.1 the scale attribute is `minecraft:generic.scale`.
   */
  setAttributeBaseValue(attribute: string, value: number): void;
}

/** ServerPlayer with PlayerKJS. */
interface KubePlayer extends KubeLivingEntity {
  /** kjs$getUsername */
  readonly username: string;
  /** kjs$setStatusMessage: the action bar text above the hotbar. */
  setStatusMessage(message: TextLike): void;
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

/** com.mojang.brigadier.builder.LiteralArgumentBuilder */
interface LiteralBuilder {
  requires(predicate: (source: CommandSource) => boolean): LiteralBuilder;
  then(child: LiteralBuilder): LiteralBuilder;
  /** The callback returns the command's result count; 1 means success. */
  executes(run: (context: CommandContext) => number): LiteralBuilder;
}

/** net.minecraft.commands.Commands, wrapped by KubeJS. */
interface Commands {
  literal(name: string): LiteralBuilder;
}

/** dev.latvian.mods.kubejs.command.CommandRegistryKubeEvent */
interface CommandRegistryEvent {
  readonly commands: Commands;
  register(command: LiteralBuilder): void;
}

/** dev.latvian.mods.kubejs.entity.EntitySpawnedKubeEvent (EntityJoinLevelEvent) */
interface EntitySpawnedEvent {
  readonly entity: KubeEntity;
}

declare const ServerEvents: {
  commandRegistry(handler: (event: CommandRegistryEvent) => void): void;
};

declare const EntityEvents: {
  /** Fires when any entity joins a level, including chunk loads. */
  spawned(handler: (event: EntitySpawnedEvent) => void): void;
  /** The same, for one entity type only. */
  spawned(entityType: string, handler: (event: EntitySpawnedEvent) => void): void;
};

/** KubeJS's ConsoleJS; output goes to logs/kubejs/server.log. */
declare const console: {
  info(...values: unknown[]): void;
  warn(...values: unknown[]): void;
  error(...values: unknown[]): void;
};

/** Replaced at build time with the version from package.json. */
declare const __VERSION__: string;
