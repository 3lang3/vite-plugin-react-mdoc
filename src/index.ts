import fs from 'fs';
import path from 'path';
import slash from 'slash2';
import { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import transformer from './transformer';

const PLUGIN_NAME = 'vite-plugin-react-mdoc';
const FILE_PATH_EXPORT_NAME = '___vitePluginReactMdocCodestring___';

type DemoType = {
  id: string;
  name: string;
  title?: string;
  code: string;
  filePath?: string;
  language?: string;
  previewerProps: any;
  dependencies?: Record<
    string,
    {
      type: string;
      value: string;
    }
  >;
};

class ExportedContent {
  #exports: string[] = [];
  #contextCode = '';

  addContext(contextCode: string): void {
    this.#contextCode += `${contextCode}\n`;
  }

  addExporting(exported: string): void {
    this.#exports.push(exported);
  }

  export(): string {
    return [this.#contextCode, `export { ${this.#exports.join(', ')} }`].join('\n');
  }
}

async function markdownToDoc(code, id, reactBabelPlugin) {
  const content = new ExportedContent();

  const rs = transformer.markdown(code, id);
  const {
    data: { demos = [] },
    contents,
  } = rs;

  const compiledReactCode = `
      function (props) {
        const Previewer = props.previewer;

        return <div>
          ${contents}
        </div>
      }
    `;

  const mdJsx = `
  import React from "react"\n
  ${demos
    .map(demo => {
      const request = `${slash(id)}.${demo.name}.${demo.language || 'jsx'}`;
      demo.id = request;
      return `import ${demo.name}, { previewerProps as ${demo.name}PreviewerProps } from '${request}'`;
    })
    .join('\n')}
  const MdContent = ${compiledReactCode}
`;
  const mdJsxResult = await reactBabelPlugin.transform(mdJsx, `\0${id}.tsx`);
  content.addContext(mdJsxResult.code.replaceAll('\\\\n', '\\n'));
  content.addExporting('MdContent');

  let exportDemos = '';
  demos.forEach((el, i) => {
    if (i === 0) exportDemos += '[';
    exportDemos += `${el.name},`;
    if (i === demos.length - 1) exportDemos += ']';
  });
  if (!exportDemos) exportDemos = '[]';

  content.addContext(`const MdDemos = ${exportDemos}`);
  content.addExporting('MdDemos');

  return {
    code: content.export(),
    demos,
  };
}

let config: ResolvedConfig;

const cache: Map<string, DemoType[]> = new Map();
const importedIdSet: Map<string, string> = new Map();

export const plugin = (): Plugin => {
  let server: ViteDevServer;
  let reactBabelPlugin: Plugin;

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
      if (id.endsWith('.md')) {
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
      if (ctx.file.endsWith('.md')) {
        const source = await ctx.read();
        const { demos } = await markdownToDoc(source, ctx.file, reactBabelPlugin);
        cache.set(ctx.file, demos);
        const updateModules: ModuleNode[] = [];
        demos.forEach(demo => {
          if (demo.filePath) return;
          const mods = server.moduleGraph.getModulesByFile(demo.id) || [];
          updateModules.push(...mods);
        });
        return [...updateModules];
      }
    },
  };
};

export default plugin;
