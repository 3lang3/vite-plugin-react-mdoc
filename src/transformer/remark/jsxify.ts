import type { Processor } from 'unified';
import toJSX from '@mapbox/hast-util-to-jsx';
import visit from 'unist-util-visit';
import { formatJSXProps } from '../utils';
import { LIB_NAME } from '../../utils/const';

/**
 * rehype compiler for compile hast to jsx
 */
export default (function jsxify() {
  this.Compiler = function compiler(ast, vFile) {
    // format props for JSX element
    visit(ast, 'element', node => {
      node.properties = formatJSXProps(node.properties);
    });

    let JSX = toJSX(ast, { wrapper: 'fragment' }) || '';

    // append previewProps for previewer
    JSX = JSX.replace(
      /data-previewer-props-replaced="([^"]+)"/g,
      `{...${LIB_NAME}Demo$1PreviewerProps}`,
    );

    return JSX;
  };
} as Processor);
