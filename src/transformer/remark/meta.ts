import path from 'path';
import slash from 'slash2';
import visit from 'unist-util-visit';
import type { YamlNode, IDumiUnifiedTransformer } from '.';
import transformer from '..';
import yaml from '../../utils/yaml';

/**
 * remark plugin for generate file meta
 */
export default function meta(): IDumiUnifiedTransformer {
  return (ast, vFile) => {
    if (this.data('fileAbsPath')) {
      const filePath = slash(path.relative(process.cwd(), this.data('fileAbsPath')))
      // append file info
      vFile.data.filePath = filePath;
    }

    // save frontmatters
    visit(ast, 'yaml', node => {
      const data = yaml((node as YamlNode).value);

      // parse markdown for features in home page
      if (data.features) {
        data.features.forEach(feat => {
          if (feat.desc) {
            feat.desc = transformer.markdown(feat.desc, null, { type: 'html' }).content;
          }
        });
      }

      // parse markdown for desc in home page
      if (data.hero?.desc) {
        data.hero.desc = transformer.markdown(data.hero.desc, null, { type: 'html' }).content;
      }

      // parse markdown for footer in home page
      if (data.footer) {
        data.footer = transformer.markdown(data.footer, null, { type: 'html' }).content;
      }

      // save frontmatter to data
      vFile.data = Object.assign(vFile.data || {}, data);
    });
  };
}
