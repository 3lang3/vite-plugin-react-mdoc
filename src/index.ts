import fs from 'fs';
import path from 'path';
import slash from 'slash2';
import { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import transformer from './transformer';

const debug = require('debug')('vite:mdoc:plugin');

type DemoType = {
  id: string;
  name: string;
  title?: string;
  code: string;
  filePath?: string;
  language?: string;
  previewerProps: any;
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

function markdownToDoc(code, id) {
  const content = new ExportedContent();

  const rs = transformer.markdown(code, id);
  const {
    data: { demos },
    contents,
  } = rs;

  const reactCode = `
      const markdown =
        <div>
          ${contents}
        </div>
    `;
  const compiledReactCode = `
      function (props) {
        const Previewer = props.previewer;
        ${
          require('@babel/core').transformSync(reactCode, {
            ast: false,
            presets: [['@babel/preset-react']],
          }).code
        }
        return markdown
      }
    `;

  content.addContext(`
    import React from "react"\n
    ${demos
      .map(demo => {
        const request = `${slash(id)}.${demo.name}.${demo.language || 'jsx'}`;

        debug(`import -> ${id}`);
        debug(`import -> ${request}`);
        demo.id = request;
        return `import ${demo.name}, { previewerProps as ${demo.name}PreviewerProps } from '${request}'`;
      })
      .join('\n')}
    const ReactComponent = ${compiledReactCode}
  `);
  content.addExporting('ReactComponent');

  let exportDemos = '';

  demos.forEach((el, i) => {
    if (i === 0) exportDemos += '[';
    exportDemos += `${el.name},`;
    if (i === demos.length - 1) exportDemos += ']';
  });

  content.addContext(`const DemoBlocks = ${exportDemos}`);
  content.addExporting('DemoBlocks');

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

  return {
    name: 'vite-plugin-mdoc',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
    },
    configureServer(_server) {
      server = _server;
    },
    resolveId(id) {
      if (/\.md\.VDOCDemo(\d+)\.(j|t)sx$/.test(id)) {
        const idPath: string = id.startsWith(config.root + '/')
          ? id
          : path.join(config.root, id.substr(1));
        debug('resolve demo:', idPath);
        return idPath;
      }
    },
    load(id) {
      const mat = id.match(/\.md\.VDOCDemo(\d+)\.(jsx|tsx)$/);
      if (mat && mat.length >= 2) {
        const [, index, suffix] = mat;
        debug(`load:${id} ${index}`);
        const mdFileName = id.replace(`.VDOCDemo${index}.${suffix}`, '');
        const mdFilePath = mdFileName.startsWith(config.root + '/')
          ? mdFileName
          : path.join(config.root, mdFileName.substr(1));

        const demoBlocks = cache.get(mdFilePath);

        const demo = demoBlocks?.[+index - 1];

        if (demo.filePath) {
          return `import ${demo.name}, { codeStr } from '${demo.filePath}';\nexport default ${demo.name};\nexport const previewerProps = { code: codeStr, language: '${demo.language}', title: '${demo.title}' }`;
        }

        return `${demo.code};\nexport const previewerProps = {code: ${JSON.stringify(demo.code)}, language: '${demo.language}', title: '${demo.title}'}`;
      }

      if (importedIdSet.has(id)) {
        const idSource = fs.readFileSync(id, 'utf8');
        return `${idSource}\n export const codeStr = ${JSON.stringify(idSource)}`;
      }
    },
    async transform(code, id) {
      if (id.endsWith('.md')) {
        const { code: content, demos } = markdownToDoc(code, id);
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
        const { demos } = markdownToDoc(source, ctx.file);
        cache.set(ctx.file, demos);
        const updateModules: ModuleNode[] = [];

        demos.forEach(demo => {
          const mods = server.moduleGraph.getModulesByFile(demo.id) || [];
          updateModules.push(...mods);
        });

        return [...updateModules];
      }
    },
  };
};

export default plugin;
