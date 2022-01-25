import slash from 'slash2';
import remark from './remark';

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

export async function transformer(code: string, id: string, reactBabelPlugin, viteConfig, pluginOptions) {
  const content = new ExportedContent();
  const { demos, value } = await remark(code, id, viteConfig, pluginOptions);

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
    mdJsxResult = await reactBabelPlugin.transform(mdJsx, `\0${id}.tsx`);
  } catch (e) {
    // babel transform fail
  }
  content.addContext(mdJsxResult.code.replaceAll('\\\\n', '\\n'));
  content.addExporting('MdContent');

  let exportDemosStr = '';
  const exportDemos = demos.filter(el => !el.inline)
  exportDemos.forEach((el, i) => {
    if (i === 0) exportDemosStr += '[';
    exportDemosStr += `{ Component: ${el.name}, id: '${el.id}',`;
    exportDemosStr += '},';
    if (i === exportDemos.length - 1) exportDemosStr += ']';
  });
  if (!exportDemos) exportDemosStr = '[]';

  content.addContext(`const MdDemos = ${exportDemosStr}`);
  content.addExporting('MdDemos');

  return {
    code: content.export(),
    demos,
  };
}
