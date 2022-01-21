import toJSX from '@mapbox/hast-util-to-jsx';
import { Options } from 'remark-parse';
import type { Root } from 'hast';
import type { CompilerFunction, Plugin } from 'unified';

/**
 * rehype compiler for compile hast to jsx
 */
export default function jsxify(): Plugin<[] | [Options], Root, string> {
  const compiler: CompilerFunction = tree => {
    let JSX = toJSX(tree, { wrapper: 'fragment' }) || '';
    return JSX;
  };

  Object.assign(this, { Compiler: compiler });
  return null;
}
