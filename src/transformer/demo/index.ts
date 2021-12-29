import { transformSync } from '@babel/core';
import * as types from '@babel/types';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import { LIB_NAME } from '../../utils/const';
interface IDemoTransformResult {
  content: string;
}

export { default as getDepsForDemo } from './dependencies';
export { getCSSForDep } from './dependencies';

export const DEMO_COMPONENT_NAME = `${LIB_NAME}Demo`;

/**
 * transform code block statments to preview
 */
export default (raw: string): IDemoTransformResult => {
  const code = transformSync(raw, {
    ast: true,
    presets: ['@babel/preset-react'],
  });
  const body = code.ast.program.body;

  // traverse all expression
  traverse(code.ast, {
    ImportDeclaration(callPath) {
      const {
        source: { value },
        specifiers: [
          {
            local: { name },
            imported,
          },
          ...restSpecifiers
        ],
      } = callPath.node;
      const nodes = [];
      if (!imported) {
        nodes.push(
          types.variableDeclaration('const', [
            types.variableDeclarator(
              types.identifier(name),
              types.awaitExpression(
                types.callExpression(types.import(), [types.stringLiteral(value)]),
              ),
            ),
          ]),
        );
        if (restSpecifiers.length) {
          nodes.push(
            types.variableDeclaration('const', [
              types.variableDeclarator(
                types.objectPattern(
                  restSpecifiers.map(el =>
                    types.objectProperty(
                      types.identifier(el.imported.name),
                      types.identifier(el.local.name),
                      false,
                      true,
                    ),
                  ),
                ),
                types.identifier(name),
              ),
            ]),
          );
        }
      } else {
        nodes.push(
          types.variableDeclaration('const', [
            types.variableDeclarator(
              types.objectPattern(
                callPath.node.specifiers.map(el =>
                  types.objectProperty(
                    types.identifier(el.imported.name),
                    types.identifier(name),
                    false,
                    true,
                  ),
                ),
              ),
              types.awaitExpression(
                types.callExpression(types.import(), [types.stringLiteral(value)]),
              ),
            ),
          ]),
        );
      }
      if (nodes.length > 1) {
        callPath.replaceWithMultiple(nodes);
        return;
      }
      callPath.replaceWith(nodes[0]);
    },
    ExportDefaultDeclaration(callPath) {
      callPath.replaceWith(
        types.returnStatement(
          types.objectExpression([
            types.objectProperty(types.stringLiteral('default'), callPath.node.declaration),
          ]),
        ),
      );
    },
  });

  // create demo function
  const demoFunction: types.FunctionExpression | types.CallExpression = types.functionExpression(null, [], types.blockStatement(body), false, true);

  const rs = generator(demoFunction, {}, raw).code;
  return {
    content: rs,
  };
};
