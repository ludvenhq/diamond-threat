import { describe, expect, it } from 'vitest';
import {
  contentPackJson,
  modsToml,
  packMcmeta,
  type ModMeta,
  scriptFileName,
} from '../scripts/lib/mod.ts';

const meta: ModMeta = {
  id: 'diamond_threat',
  name: 'Diamond Threat',
  version: '1.2.3',
  description: 'Diamonds make "monsters" bigger.',
  authors: 'Ludven',
  license: 'MIT',
  homepage: 'https://github.com/ludvenhq/diamond-threat#readme',
  issues: 'https://github.com/ludvenhq/diamond-threat/issues',
  minecraft: '[1.21.1]',
  dependencies: {
    neoforge: '[21.1.199,)',
    kubejs: '[2101.7.2-build.374,)',
    kubeloader: '[21-0.1.0-Alpha-3,)',
  },
};

describe('mod metadata', () => {
  it('names the script after the mod id', () => {
    expect(scriptFileName(meta)).toBe('diamond-threat.js');
  });

  it('writes the contentpack.json fields KubeLoader reads', () => {
    expect(JSON.parse(contentPackJson(meta))).toEqual({
      id: 'diamond_threat',
      name: 'Diamond Threat',
      description: 'Diamonds make "monsters" bigger.',
      version: '1.2.3',
      authors: ['Ludven'],
    });
  });

  it('writes a lowcodefml neoforge.mods.toml with every dependency required', () => {
    const toml = modsToml(meta);
    expect(toml).toContain('modLoader = "lowcodefml"\nloaderVersion = "[1,)"');
    expect(toml).toContain('modId = "diamond_threat"\nversion = "1.2.3"');
    expect(toml).toContain('description = "Diamonds make \\"monsters\\" bigger."');
    expect(toml.match(/\[\[dependencies\.diamond_threat\]\]/g)).toHaveLength(4);
    expect(toml.match(/type = "required"/g)).toHaveLength(4);
    expect(toml).not.toContain('mandatory');
    expect(toml).toContain(
      'modId = "kubejs"\ntype = "required"\nversionRange = "[2101.7.2-build.374,)"\nordering = "AFTER"',
    );
    expect(toml).toContain(
      'modId = "minecraft"\ntype = "required"\nversionRange = "[1.21.1]"\nordering = "NONE"',
    );
  });

  it('writes pack format 34 for 1.21.1', () => {
    expect(JSON.parse(packMcmeta(meta))).toMatchObject({ pack: { pack_format: 34 } });
  });
});
