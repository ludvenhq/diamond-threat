import { describe, expect, it } from 'vitest';
import { findRhinoProblems } from '../scripts/lib/rhino-syntax.ts';

const wrap = (body: string): string => `(() => {\n${body}\n})();\n`;
const messages = (code: string): string[] => findRhinoProblems(code).map((p) => p.message);

describe('findRhinoProblems', () => {
  it('passes what release Rhino runs', () => {
    const code = wrap(
      [
        'const a = 1; let b = [a, 2];',
        'const o = { a: a, f: function () { return 1; }, g() { return 2; } };',
        'const { x, y: [z] } = { x: 1, y: [2] };',
        'for (const v of b) { console.info(`v=${v}`); }',
        'const square = (n) => n ** 2;',
        'function* gen() { yield 1; }',
      ].join('\n'),
    );
    expect(findRhinoProblems(code)).toEqual([]);
  });

  it.each([
    ['spread in calls', 'f(...args);', 'spread'],
    ['spread in arrays', 'const a = [...b];', 'spread'],
    ['object spread', 'const a = { ...b };', 'spread'],
    ['rest parameters', 'function f(...args) {}', 'rest'],
    ['rest in destructuring', 'const { a, ...others } = b;', 'rest'],
    ['default parameters', 'function f(a = 1) {}', 'default values'],
    ['defaults in destructuring', 'const { a = 1 } = b;', 'default values'],
    ['classes', 'class A {}', '`class`'],
    ['async functions', 'async function f() {}', '`async`'],
    ['async arrows', 'const f = async () => 1;', '`async`'],
    ['shorthand properties', 'const o = { a };', 'shorthand'],
    ['computed keys', 'const o = { [k]: 1 };', 'computed keys'],
    ['optional chaining', 'const v = a?.b;', 'optional chaining'],
    ['nullish coalescing', 'const v = a ?? 1;', '`??`'],
    ['logical assignment', 'a ||= 1;', 'logical assignment'],
    ['BigInt', 'const n = 1n;', 'BigInt'],
  ])('rejects %s', (_name, body, expected) => {
    expect(messages(wrap(body)).join(' / ')).toContain(expected);
  });

  it('rejects top-level declarations, which would leak into the shared scope', () => {
    expect(messages('const a = 1;\n')).toEqual([
      "top-level VariableDeclaration: the bundle must leak nothing into KubeJS's shared scope",
    ]);
  });

  it('allows a "use strict" directive and the wrapping call', () => {
    expect(findRhinoProblems(`"use strict";\n${wrap('const a = 1;')}`)).toEqual([]);
  });

  it('reports the line and column of the problem', () => {
    expect(findRhinoProblems(wrap('const a = 1;\nf(...a);'))).toEqual([
      { line: 3, column: 3, message: 'spread (`...x`) does not run on release Rhino' },
    ]);
  });

  it('reports code that does not parse', () => {
    expect(messages('(() => {')[0]).toMatch(/^does not parse/);
  });
});
