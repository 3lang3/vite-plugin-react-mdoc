import { visit } from 'unist-util-visit';
import type { MDocUnifiedTransformer, MDocElmNode } from '../types'
/**
 * remark plugin for generate file meta
 */
export default function previewer(): MDocUnifiedTransformer<MDocElmNode> {
  return (tree) => {
    visit<MDocElmNode, string>(tree, 'element', (node) => {
      if (node.tagName === 'div' && node.properties?.type === 'previewer') {
        // 
        console.log(node);
        
      }
    });
  };
}
