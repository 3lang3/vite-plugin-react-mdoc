import visit from 'unist-util-visit';
import is from 'hast-util-is-element';

/**
 * remark plugin for generate file meta
 */
export default function custom() {
  return ast => {
    visit(ast, 'element', (node, index, parent) => {
      if (is(node, 'h3') && parent.type === 'root') {
        // replace original node
        const childrenLen = parent.children.length;
        const remainAllSiblings = parent.children.slice(index + 1);
        const nextSiblingPos = remainAllSiblings.findIndex(
          c => c.tagName === 'h1' || c.tagName === 'h2' || c.tagName === 'h3',
        );
        const nextSiblingIdx = nextSiblingPos === -1 ? childrenLen : nextSiblingPos + index;
        const siblings = parent.children.slice(index, nextSiblingIdx);

        
        parent.children.splice(index, siblings.length, {
          type: 'element',
          tagName: 'div',
          position: node.position,
          properties: {
            class: 'van-doc-card',
          },
          children: siblings,
        });
        return ast
      }
    });
  };
}
