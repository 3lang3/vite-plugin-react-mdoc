import { visit } from 'unist-util-visit';
import type { Transformer } from 'unified';
import yaml from '../utils/yaml';
import type { Code } from 'mdast';

/**
 * parser for parse modifier of code block
 * @param meta  meta raw string
 */
function codeBlockModifierParser(meta: string): Record<string, string> {
  return (meta || '').split('|').reduce((result, item) => {
    item = String.prototype.trim.call(item);

    if (item) {
      result[item] = true;
    }

    return result;
  }, {});
}

export type YamlNode = Omit<Code, 'meta' | 'type'> & {
  meta: string | Record<string, string>;
  type: string;
};

/**
 * remark plugin for parse code tag to external demo
 */
export default function language(): Transformer<YamlNode> {
  return tree => {
    visit<YamlNode, string>(tree, 'code', node => {
      const modifier = codeBlockModifierParser(node.meta as string);
      const pluginOptions = this.data('pluginOptions');
      if (
        pluginOptions?.previewLangs?.includes(node.lang) &&
        (!pluginOptions?.passivePreview ||
          (pluginOptions.passivePreview && modifier.preview))
      ) {
        // extract frontmatters for embedded demo
        const [, comments = '', content = ''] = node.value
          // clear head break lines
          .replace(/^\n\s*/, '')
          // split head comments & remaining code
          .match(/^(\/\*\*[^]*?\n\s*\*\/)?(?:\s|\n)*([^]+)?$/);

        const frontmatter = comments
          // clear / from head & foot for comment
          .replace(/^\/|\/$/g, '')
          // remove * from comments
          .replace(/(^|\n)\s*\*+/g, '$1');

        const meta = yaml(frontmatter);

        if (modifier.pure) {
          // clear useless meta if the lang with pure modifier
          node.meta = (node.meta as string).replace(/ ?\| ?pure/, '') || null;
        } else {
          // customize type (use for rehype demo handler)
          node.type = 'demo';
          node.meta = meta;
          node.value = content;
        }
      }
    });
  };
}
