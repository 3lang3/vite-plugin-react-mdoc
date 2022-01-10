import fs from 'fs';
import path from 'path';
import type { Node } from 'unist';
import visit from 'unist-util-visit';
import slash from 'slash2';
import demoTransformer, { DEMO_COMPONENT_NAME } from '../../demo';
import transformer from '../..';
import { decodeHoistImportToContent } from '../../utils';
import builtinTransformer from './builtin';
import type { IDumiUnifiedTransformer } from '..';
import type { IPreviewerTransformer, IPreviewerTransformerResult } from './builtin';

export const previewerTransforms: IPreviewerTransformer[] = [builtinTransformer];

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
function getPreviewerId(yaml: any, mdAbsPath: string, language: string) {
  let id = yaml.identifier || yaml.uuid;
  // do not generate identifier for inline demo
  if (yaml.inline || !/(t|j)sx/.test(language)) {
    return;
  }

  if (!id) {
    // for code block demo, format: component-demo-N
    const idMap = mdCodeBlockIdMap.get(mdAbsPath);
    id = [idMap.id, idMap.count, 'demo'].filter(Boolean).join('-');

    // record id count
    const currentIdCount = idMap.map.get(id) || 1;

    idMap.map.set(id, currentIdCount + 1);

    // append count suffix
    id = `${currentIdCount}`;
  }

  return id;
}

/**
 * get demo dependencies meta data from previewer props
 * @param props previewer props
 * @param lang  node lang
 */
function getDemoDeps(props: IPreviewerTransformerResult['previewerProps'], lang: string) {
  return {
    // append npm dependencies
    ...Object.entries(props.dependencies || {}).reduce(
      (deps, [pkg, dep]) =>
        Object.assign(deps, {
          [pkg]: {
            type: 'NPM',
            // TODO: get real version rule from package.json
            value: (dep as any).version,
          },
        }),
      {},
    ),
    // append local file dependencies
    ...Object.entries(props.sources).reduce(
      (result, [file, item]) =>
        Object.assign(result, {
          // handle legacy main file
          ...(file === '_'
            ? {
                [`index.${lang}`]: {
                  type: 'FILE',
                  value: decodeHoistImportToContent(Object.values(item)[0] as string),
                },
              }
            : {
                [file]: {
                  type: 'FILE',
                  value: item.content || fs.readFileSync(item.path, 'utf-8').toString(),
                },
              }),
        }),
      {},
    ),
  };
}

/**
 * transform meta data for node
 * @param meta  node meta data from attribute & frontmatter
 */
function transformNodeMeta(meta: Record<string, any>) {
  Object.keys(meta).forEach(key => {
    const matched = key.match(/^desc(?:(\.[\w-]+$)|$)/);

    // compatible with short-hand usage for description field in previous dumi versions
    if (matched) {
      key = `description${matched[1] || ''}`;
      meta[key] = meta[matched[0]];
      delete meta[matched[0]];
    }

    // transform markdown for description field
    if (/^description(\.|$)/.test(key)) {
      meta[key] = transformer.markdown(meta[key], null, {
        type: 'html',
      }).content;
    }
  });

  return meta;
}

const visitor = function (node, i, parent) {
  if (node.tagName === 'div' && node.properties?.type === 'previewer') {
    // transform node to Previewer meta
    let previewerProps: IPreviewerTransformerResult['previewerProps'];
    // execute transformers to get the first valid result, and save currying transformer
    previewerTransforms.some(item => {
      const caller = () =>
        item.fn({
          attrs: { src: node.properties.src, ...node.properties.meta },
          mdAbsPath: this.data('fileAbsPath'),
          node,
        });
      const result = caller();
      // get result from transformer
      if (result) {
        // generate demo id
        const identifier = getPreviewerId(
          node.properties.meta,
          this.data('fileAbsPath'),
          node.properties.lang,
        );
        // fill fields for tranformer result
        const decorateResult = (o: IPreviewerTransformerResult) => {
          // extra meta for external demo
          if (node.properties.filePath) {
            const { meta } = transformer.code(node.properties.source);

            // save original attr meta on code tag, to avoid node meta override frontmatter in HMR
            node.properties._ATTR_META = node.properties._ATTR_META || node.properties.meta;
            node.properties.meta = Object.assign(meta, node.properties._ATTR_META);
          }

          // transform node meta data
          node.properties.meta = transformNodeMeta(node.properties.meta);

          // set componentName for previewer props
          o.previewerProps.componentName = this.vFile.data.componentName;

          // assign node meta to previewer props (allow user override props via frontmatter or attribute)
          Object.assign(o.previewerProps, node.properties.meta);

          // force override id for previewer props
          o.previewerProps.identifier = identifier;

          // fallback dependencies & sources
          o.previewerProps.sources = o.previewerProps.sources || {};
          // generate demo dependencies from previewerProps.sources
          o.previewerProps.dependencies = getDemoDeps(o.previewerProps, node.properties.lang);
          return o;
        };

        // export result
        ({ previewerProps } = decorateResult(result));

        console.log(previewerProps.dependencies)
      }
      // use the first valid result
      return result;
    });
    // const code = demoTransformer(node.properties.source).content;
    const code = node.properties.source;

    const isDemoNode = !previewerProps.inline && /(j|t)sx/.test(node.properties.lang);

    if (isDemoNode) {
      // use to declare demos in the page component
      this.vFile.data.demos = (this.vFile.data.demos || []).concat({
        filePath: node.properties.filePath,
        title: previewerProps.title,
        name: `${DEMO_COMPONENT_NAME}${(this.vFile.data.demos?.length || 0) + 1}`,
        code,
        language: node.properties.lang,
        inline: previewerProps.inline,
        identifier: previewerProps.identifier,
        dependencies: previewerProps.dependencies,
        previewerProps,
      });
    }

    let properties = {};

    if (isDemoNode) {
      properties['data-previewer-props-replaced'] = previewerProps.identifier;
    } else {
      properties = {
        code,
        language: node.properties.lang,
        inline: previewerProps.inline,
        identifier: previewerProps.identifier,
        title: previewerProps.title,
      };
    }

    parent.children[i] = {
      previewer: true,
      type: 'element',
      tagName: 'Previewer',
      properties,
    };
  }
};

export type { IPreviewerTransformer };

export default function previewer(): IDumiUnifiedTransformer {
  return (ast: Node, vFile) => {
    // record code block id
    if (this.data('fileAbsPath')) {
      const mapObj = mdCodeBlockIdMap.get(this.data('fileAbsPath'));

      if (!mapObj) {
        // initialize map
        const prefix =
          vFile.data.componentName ||
          path.basename(
            slash(this.data('fileAbsPath')).replace(
              /(?:\/(?:index|readme))?(\.[\w-]+)?\.md/i,
              '$1',
            ),
          );

        mdCodeBlockIdMap.set(this.data('fileAbsPath'), {
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

    visit(ast, 'element', visitor.bind({ vFile, data: this.data }));
  };
}
