/**
 * The syntax gate: finds JavaScript in the built bundle that release Rhino cannot run.
 *
 * KubeJS runs scripts on its own fork of Rhino. Most players have the release build
 * (2101.2.7-build.85 in October 2026), which lacks a lot of modern syntax that the beta has. The
 * lint rules keep this syntax out of src/, esbuild lowers `?.` and `??`, and this gate checks the
 * actual output, so nothing reaches a player's game that their Rhino would reject. The list comes
 * from running test cases on builds 81, 85 and 91; docs/architecture.md has the full table.
 */
import { parse } from 'acorn';

export interface RhinoProblem {
  line: number;
  column: number;
  message: string;
}

interface AstNode {
  type: string;
  start: number;
  [key: string]: unknown;
}

function isNode(value: unknown): value is AstNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { start?: unknown }).start === 'number'
  );
}

const LOGICAL_ASSIGNMENT = new Set(['||=', '&&=', '??=']);

/** Returns why this node cannot run on release Rhino, or null when it can. */
function problemWith(node: AstNode, parent: AstNode | null): string | null {
  switch (node.type) {
    case 'SpreadElement':
      return 'spread (`...x`) does not run on release Rhino';
    case 'RestElement':
      return 'rest (`...x`) does not run on release Rhino';
    case 'AssignmentPattern':
      return 'default values in parameters or destructuring do not run on release Rhino';
    case 'ClassDeclaration':
    case 'ClassExpression':
      return '`class` is a reserved word in Rhino';
    case 'AwaitExpression':
      return '`await` does not run in Rhino';
    case 'ChainExpression':
      return 'optional chaining (`?.`) does not short-circuit on release Rhino';
    case 'ImportExpression':
    case 'ImportDeclaration':
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
    case 'ExportAllDeclaration':
    case 'MetaProperty':
      return 'Rhino has no modules';
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return node.async === true ? '`async` functions do not run in Rhino' : null;
    case 'Property':
      if (node.computed === true) return 'computed keys (`{ [k]: v }`) do not run on release Rhino';
      // Shorthand in a destructuring pattern (`const { a } = o`) runs; in an object literal it does not.
      if (node.shorthand === true && parent?.type === 'ObjectExpression') {
        return 'shorthand properties (`{ a }`) do not run on release Rhino';
      }
      return null;
    case 'LogicalExpression':
      return node.operator === '??' ? '`??` gives wrong results on release Rhino' : null;
    case 'AssignmentExpression':
      return LOGICAL_ASSIGNMENT.has(String(node.operator))
        ? 'logical assignment (`||=`, `&&=`, `??=`) does not run on release Rhino'
        : null;
    case 'Literal':
      return 'bigint' in node ? 'BigInt does not run in Rhino' : null;
    default:
      return null;
  }
}

function lineAndColumn(code: string, offset: number): { line: number; column: number } {
  const before = code.slice(0, offset).split('\n');
  return { line: before.length, column: (before[before.length - 1] ?? '').length + 1 };
}

/**
 * Checks a built bundle. Besides the syntax, the bundle must declare nothing at its top level:
 * KubeJS evaluates all server scripts in one shared scope, so a top-level `const` would clash
 * with another script's.
 */
export function findRhinoProblems(code: string): RhinoProblem[] {
  let program: AstNode;
  try {
    program = parse(code, { ecmaVersion: 'latest', sourceType: 'script' }) as unknown as AstNode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [{ line: 1, column: 1, message: `does not parse: ${message}` }];
  }

  const problems: RhinoProblem[] = [];
  const report = (node: AstNode, message: string): void => {
    problems.push({ ...lineAndColumn(code, node.start), message });
  };

  const body = Array.isArray(program.body) ? (program.body as unknown[]) : [];
  for (const statement of body) {
    if (isNode(statement) && statement.type !== 'ExpressionStatement') {
      report(
        statement,
        `top-level ${statement.type}: the bundle must leak nothing into KubeJS's shared scope`,
      );
    }
  }

  const visit = (node: AstNode, parent: AstNode | null): void => {
    const problem = problemWith(node, parent);
    if (problem !== null) report(node, problem);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) if (isNode(item)) visit(item, node);
      } else if (isNode(value)) {
        visit(value, node);
      }
    }
  };
  visit(program, null);

  return problems.sort((a, b) => a.line - b.line || a.column - b.column);
}
