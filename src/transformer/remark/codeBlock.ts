import visit from 'unist-util-visit';
import { winEOL } from '../../utils';
import type { IDumiUnifiedTransformer } from '.';
import transformer from '..';

/**
 * parser for parse modifier of code block
 * @param meta  meta raw string
 */
function codeBlockModifierParser(meta: string): Record<string, any> {
  return (meta || '').split('|').reduce((result, item) => {
    item = String.prototype.trim.call(item);

    if (item) {
      result[item] = true;
    }

    return result;
  }, {});
}

/**
 * rehype plugin for convert code block to demo compomnent
 */
export default function codeBlock(): IDumiUnifiedTransformer {
  return (ast: any) => {
    // handle md code block syntax
    visit(ast, 'code', node => {
      const modifier = codeBlockModifierParser(node.meta);
      // extract frontmatters for embedded demo
      const { content, meta } = transformer.code(winEOL(node.value));

      if (modifier.pure) {
        // clear useless meta if the lang with pure modifier
        node.meta = node.meta.replace(/ ?\| ?pure/, '') || null;
      } else {
        // customize type (use for rehype demo handler)
        node.type = 'demo' as any;
        node.meta = { ...modifier, ...meta } as any;
        node.value = content;
      }
    });
  };
}
