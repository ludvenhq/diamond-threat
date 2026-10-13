/**
 * Turns what the game hands a script into plain ids. Depending on which member Rhino resolves,
 * an entity's type reads as KubeJS's id (`minecraft:zombie`) or as vanilla's EntityType, whose
 * string is its description id (`entity.minecraft.zombie`); a level's dimension reads as KubeJS's
 * id or as a vanilla ResourceKey (`ResourceKey[minecraft:dimension / minecraft:overworld]`).
 */

/** `minecraft:zombie` from either `minecraft:zombie` or `entity.minecraft.zombie`. */
export function entityTypeId(raw: string): string {
  if (!raw.startsWith('entity.')) return raw;
  const rest = raw.slice('entity.'.length);
  const dot = rest.indexOf('.');
  return dot < 0 ? rest : `${rest.slice(0, dot)}:${rest.slice(dot + 1)}`;
}

/** `inWall` from either the message id or the DamageType record's string (`DamageType[msgId=inWall, ...]`). */
export function damageMsgId(raw: string): string {
  const match = /msgId=([^,\]\s]+)/.exec(raw);
  return match?.[1] ?? raw;
}

/** `minecraft:overworld` from either the id or a ResourceKey's string. */
export function dimensionId(raw: string): string {
  const match = /^ResourceKey\[[^/\]]+\/\s*([^\]\s]+)\s*\]$/.exec(raw);
  return match?.[1] ?? raw;
}
