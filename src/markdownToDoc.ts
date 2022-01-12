import slash from 'slash2';
import transformer from './transformer';

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

export async function markdownToDoc(code: string, id: string, reactBabelPlugin) {
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

  let mdJsxResult = {  code: '' }
  try {
    mdJsxResult = await reactBabelPlugin.transform(mdJsx, `\0${id}.tsx`);
  } catch (e) {
    // 
  }
  content.addContext(mdJsxResult.code.replaceAll('\\\\n', '\\n'));
  content.addExporting('MdContent');

  let exportDemos = '';
  demos.forEach((el, i) => {
    if (i === 0) exportDemos += '[';
    exportDemos += `{ Component: ${el.name}, id: '${el.id}',`;
    if (el.title) exportDemos += `title: '${el.title}',`;
    exportDemos += '},';
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
