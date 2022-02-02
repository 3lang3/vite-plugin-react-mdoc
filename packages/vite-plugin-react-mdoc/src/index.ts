import fs from 'fs';
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import type { FilterPattern } from '@rollup/pluginutils';
import { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { transformer } from './transformer';
import type { MDocDemoType } from './types';

const PLUGIN_NAME = 'vite-plugin-react-mdoc';
const FILE_PATH_EXPORT_NAME = '___vitePluginReactMdocCodestring___';

const cache: Map<string, MDocDemoType[]> = new Map();
const importedIdSet: Map<string, string> = new Map();

export type CodeBlockOutputType = 'independent' | 'markdown';

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  /** 强制制定root目录 一般用于cli构建工具 */
  root?: string;
  /** 
   * 接受预览的语言后缀 
   * @default ["jsx","tsx"]
   */
  previewLangs?: string[];
  /**
   * 代码块被动渲染模式
   * 当为 true 时，仅将属于 previewLangs 且具有 preview 修饰符的代码块渲染为 ReactComponent 代码块。
   * 一般用于仅希望渲染 previewLangs 中的少部分代码块，而不是全部。
   */
  passivePreview?: boolean;
  /**
   * 手动收集deps
   * 由于各种原因可能代码依赖收集有部分缺失，用来手动补全依赖
   * 
   * ```
   * 'localPkgs': {
   *  'react-vant': {
   *    'version': '2.0.0-alpha16'
   *  }
   * }
   * ```
   */
  localPkgs?: Record<string, { version: string }>;

  /**
   * 代码块输出形式
   * @default ["independent"]
   * 
   * - independent 将代码块组件独立输出
   * - markdown 将代码块组件直接输出到文档中
   */
  codeBlockOutput?: CodeBlockOutputType[];
}

const pluginOptions: Options = {
  include: /\.md$/,
  previewLangs: ['jsx', 'tsx'],
  codeBlockOutput: ['independent']
}


const plugin = (options: Options = {}): Plugin => {
  const userOptions = { ...pluginOptions, ...options };
  let server: ViteDevServer;
  let config: ResolvedConfig;
  let reactBabelPlugin: Plugin;
  const filter = createFilter(userOptions.include || /\.md$/, userOptions.exclude);

  return {
    name: PLUGIN_NAME,
    configResolved(resolvedConfig) {
      // store the resolved config
      config = { ...resolvedConfig, root: userOptions?.root || resolvedConfig.root };
      reactBabelPlugin = resolvedConfig.plugins.find(el => el.name === 'vite:react-babel');
    },
    configureServer(_server) {
      server = _server;
    },
    resolveId(id) {
      const mat = id.match(/\.md\.MdocDemo\d+\.(.*)\.(jsx|tsx)$/);
      if (mat && mat.length > 2) {
        const [, sourceIdBase64] = mat;
        const sourceId = Buffer.from(sourceIdBase64, 'base64').toString('ascii');
        const idPath: string = id.startsWith(sourceId)
          ? id
          : path.join(config.root, id.substring(1));
        return idPath;
      }
    },
    load(id) {
      const mat = id.match(/\.md\.MdocDemo(\d+)(\..*)\.(jsx|tsx)$/);
      if (mat && mat.length >= 2) {
        const [, index, sourceId, suffix] = mat;
        id = id.replace(sourceId, '');
        const mdFileName = id.replace(`.MdocDemo${index}.${suffix}`, '');
        const demos = cache.get(mdFileName);
        const demo = demos?.[+index - 1];
        if (!demo) return null;

        if (demo.filePath) {
          return {
            code: `import ${demo.name}, { ${FILE_PATH_EXPORT_NAME} } from '${demo.filePath
              }';\nexport default ${demo.name
              };\nexport const previewerProps = { code: ${FILE_PATH_EXPORT_NAME}, ...${JSON.stringify(demo.props)} }`,
            map: { mappings: '' },
          };
        }

        return {
          code: `${demo.code};\nexport const previewerProps = {code: ${JSON.stringify(
            demo.code,
          )}, ...${JSON.stringify(demo.props)} }`,
          map: { mappings: '' },
        };
      }

      if (importedIdSet.has(id)) {
        const idSource = fs.readFileSync(id, 'utf8');
        return `${idSource}\n export const ${FILE_PATH_EXPORT_NAME} = ${JSON.stringify(idSource)}`;
      }
    },
    async transform(code, id) {
      if (filter(id)) {
        const { code: content, demos } = await transformer(code, id, reactBabelPlugin, config, userOptions);
        cache.set(id, demos);
        demos.forEach(demo => {
          if (demo.filePath) {
            importedIdSet.set(demo.filePath, id);
          }
        });
        return { code: content };
      }
    },
    async handleHotUpdate(ctx) {
      if (filter(ctx.file)) {
        const source = await ctx.read();
        const { demos } = await transformer(source, ctx.file, reactBabelPlugin, config, userOptions);
        cache.set(ctx.file, demos);
        const updateModules: ModuleNode[] = [];
        demos.forEach(demo => {
          if (demo.filePath) return;
          const mods = server.moduleGraph.getModulesByFile(demo.id) || [];
          updateModules.push(...mods);
        });
        return [...ctx.modules, ...updateModules];
      }
    },
  };
};

export default plugin;
