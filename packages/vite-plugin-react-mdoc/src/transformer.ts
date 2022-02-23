import slash from 'slash2';
import type { PluginOption, ResolvedConfig } from 'vite';
import type { MDocOptions } from '.';
import remark from './remark';

class ExportedContent {
  #exports: string[] = [];
  #contextCode = '/* @vite-ignore */\n';

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

export async function transformer(code: string, id: string, reactBabelPlugin: PluginOption, viteConfig: ResolvedConfig, pluginOptions: MDocOptions) {
  const content = new ExportedContent();
  const { demos, slugs, meta, value } = await remark(code, id, viteConfig, pluginOptions);

  const compiledReactCode = `
      function ({ previewer = () => null }) {
        const Previewer = previewer;
        return <div>
          ${value}
        </div>
      }
    `;

  const mdJsx = `
  import React from "react"\n
  ${demos
      .map(demo => {
        const request = `${slash(id)}.${demo.name}.${Buffer.from(id).toString('base64')}.${demo.props?.lang || 'jsx'}`;
        demo.id = request;
        return `import ${demo.name}, { previewerProps as ${demo.name}PreviewerProps } from '${request}'`;
      })
      .join('\n')}
  const MdContent = ${compiledReactCode}
`;
  let mdJsxResult = { code: '' }
  try {
    mdJsxResult = await (reactBabelPlugin as any).transform(mdJsx, `\0${id}.tsx`);
  } catch (e) {
    // babel transform fail
    console.log('reactBabelPlugin error: ', e);
    mdJsxResult.code = `const MdContent = ''`
  }
  content.addContext(mdJsxResult.code);
  content.addExporting('MdContent');

  let exportDemosStr = '';
  if (pluginOptions.codeBlockOutput.includes('independent')) {
    const exportDemos = demos.filter(el => !el.inline)
    exportDemos.forEach((el, i) => {
      if (i === 0) exportDemosStr += '[';
      exportDemosStr += `{ Component: ${el.name}, key: '${el.props.key}', ...${JSON.stringify(el.props.meta)},`;
      exportDemosStr += '},';
      if (i === exportDemos.length - 1) exportDemosStr += ']';
    });
  }
  if (!exportDemosStr) exportDemosStr = '[]';
  content.addContext(`const MdDemos = ${exportDemosStr}`);
  content.addExporting('MdDemos');

  content.addContext(`const frontmatter = ${JSON.stringify(meta)}`)
  content.addExporting('frontmatter');

  content.addContext(`const slugs = ${JSON.stringify(slugs)}`)
  content.addExporting('slugs');

  content.addContext(`
  export default function (props) {
    return props.children({ MdContent, MdDemos, frontmatter, slugs })
  }
  `)


  return {
    code: content.export(),
    demos,
  };
}
