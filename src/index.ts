import fs from 'fs';
import { createFilter } from '@rollup/pluginutils'
import path from 'path';
import { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { DemoType, Options } from './types';
import { markdownToDoc } from './markdownToDoc';

const PLUGIN_NAME = 'vite-plugin-react-mdoc';
const FILE_PATH_EXPORT_NAME = '___vitePluginReactMdocCodestring___';

let config: ResolvedConfig;

const cache: Map<string, DemoType[]> = new Map();
const importedIdSet: Map<string, string> = new Map();

export const plugin = (userOptions: Options = {}): Plugin => {
  let server: ViteDevServer;
  let reactBabelPlugin: Plugin;

  const filter = createFilter(
    userOptions.include || /\.md$/,
    userOptions.exclude,
  )

  return {
    name: PLUGIN_NAME,
    configResolved(resolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
      reactBabelPlugin = resolvedConfig.plugins.find(el => el.name === 'vite:react-babel');
    },
    configureServer(_server) {
      server = _server;
    },
    resolveId(id) {
      if (/\.md\.VDOCDemo(\d+)\.(j|t)sx$/.test(id)) {
        const idPath: string = id.startsWith(config.root + '/')
          ? id
          : path.join(config.root, id.substring(1));
        return idPath;
      }
    },
    load(id) {
      const mat = id.match(/\.md\.VDOCDemo(\d+)\.(jsx|tsx)$/);
      if (mat && mat.length >= 2) {
        const [, index, suffix] = mat;
        const mdFileName = id.replace(`.VDOCDemo${index}.${suffix}`, '');
        const mdFilePath = mdFileName.startsWith(config.root + '/')
          ? mdFileName
          : path.join(config.root, mdFileName.substring(1));

        const demoBlocks = cache.get(mdFilePath);
        const demo = demoBlocks?.[+index - 1];

        if (demo.filePath) {
          return {
            code: `import ${demo.name}, { ${FILE_PATH_EXPORT_NAME} } from '${
              demo.filePath
            }';\nexport default ${
              demo.name
            };\nexport const previewerProps = { code: ${FILE_PATH_EXPORT_NAME}, language: '${
              demo.language
            }', title: '${demo.title}', dependencies: ${JSON.stringify(demo.dependencies)} }`,
            map: { mappings: '' },
          };
        }

        return {
          code: `${demo.code};\nexport const previewerProps = {code: ${JSON.stringify(
            demo.code,
          )}, language: '${demo.language}', title: '${demo.title}', dependencies: ${JSON.stringify(
            demo.dependencies,
          )} }`,
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
        const { code: content, demos } = await markdownToDoc(code, id, reactBabelPlugin);
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
        const { demos } = await markdownToDoc(source, ctx.file, reactBabelPlugin);
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
