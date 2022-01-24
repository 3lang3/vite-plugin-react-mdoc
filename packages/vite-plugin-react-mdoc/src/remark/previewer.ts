import { visit } from 'unist-util-visit';
import slash from 'slash2';
import type { MDocUnifiedTransformer, MDocElmNode } from '../types'
import path from 'path';
import analyzeDeps from '../utils/analyzeDeps';


/**
 * cache id for each external demo file
 */
const externalCache = new Map<string, string>();
/**
 * record external demo id count
 */
const externalIdMap = new Map<string, number>();
/**
 * record code block demo id count
 */
const mdCodeBlockIdMap = new Map<string, { id: string; count: number; map: Map<string, number> }>();

/**
 * get unique id for previewer
 * @param yaml          meta data
 * @param mdAbsPath     md absolute path
 * @param codeAbsPath   code absolute path, it is seem as mdAbsPath for embed demo
 */
function getPreviewerId(yaml: Record<string, string>, mdAbsPath: string, codeAbsPath: string) {
  let id = yaml.identifier || yaml.uuid;
  // do not generate identifier for inline demo
  if (yaml.inline) {
    return;
  }

  if (!id) {
    if (mdAbsPath === codeAbsPath) {
      // for code block demo, format: component-demo-N
      const idMap = mdCodeBlockIdMap.get(mdAbsPath);
      id = [idMap.id, idMap.count, 'demo'].filter(Boolean).join('-');

      // record id count
      const currentIdCount = idMap.map.get(id) || 0;

      idMap.map.set(id, currentIdCount + 1);

      // append count suffix
      id += currentIdCount ? `-${currentIdCount}` : '';
    } else {
      // for external demo, format: dir-file-N
      // use cache first
      id = externalCache.get(codeAbsPath);

      if (!id) {
        const words = (slash(codeAbsPath) as string)
          // discard index & suffix like index.tsx
          .replace(/(?:\/index)?(\.[\w-]+)?\.\w+$/, '$1')
          .split(/\//)
          .map(w => w.toLowerCase());
        // /path/to/index.tsx -> to || /path/to.tsx -> to
        const demoName = words[words.length - 1] || 'demo';
        const prefix = words
          .slice(0, -1)
          .filter(word => !/^(src|_?demos?|_?examples?)$/.test(word))
          .pop();

        id = `${prefix}-${demoName}`;

        // record id count
        const currentIdCount = externalIdMap.get(id) || 0;

        externalIdMap.set(id, currentIdCount + 1);

        // append count suffix
        id += currentIdCount ? `-${currentIdCount}` : '';

        externalCache.set(codeAbsPath, id);
      }
    }
  }

  return id;
}


/**
 * remark plugin for generate file meta
 */
export default function previewer(): MDocUnifiedTransformer<MDocElmNode> {
  return (tree, vFile) => {
    const fileAbsPath = this.data('fileAbsPath')
    if (fileAbsPath) {
      const mapObj = mdCodeBlockIdMap.get(fileAbsPath);

      if (!mapObj) {
        // initialize map
        const prefix =
          vFile.data.componentName ||
          path.basename(
            slash(fileAbsPath).replace(
              /(?:\/(?:index|readme))?(\.[\w-]+)?\.md/i,
              '$1',
            ),
          );

        mdCodeBlockIdMap.set(fileAbsPath, {
          // save builtin-rule id
          id: prefix,
          // save conflict count
          count: Array.from(mdCodeBlockIdMap.values()).filter(m => m.id === prefix).length,
          // create code block id map
          map: new Map(),
        });
      } else {
        // clear single paths for a new transform flow
        mapObj.map = new Map();
      }
    }

    visit<MDocElmNode, string>(tree, 'element', (node) => {
      if (node.tagName === 'div' && node.properties?.type === 'previewer') {
        // generate demo id
        const identifier = getPreviewerId(
          node.properties.meta,
          fileAbsPath,
          node.properties.filePath || fileAbsPath,
        );
        console.log(identifier, node.properties.meta);
        if (!node.properties.meta?.inline) {
          const { files, dependencies } = analyzeDeps(node.properties.source, {
            isTSX: /^tsx?$/.test(node.properties.lang),
            fileAbsPath,
            viteConfig: this.data('viteConfig'),
            pluginOptions: this.data('pluginOptions'),
          });
          
  
          console.log(files, dependencies);
        }
      }
    });
  };
}
