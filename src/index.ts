import { Plugin } from 'vite';
import { TransformResult } from 'rollup';
import { Element, Node as DomHandlerNode } from 'domhandler';
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

const tf = (code: string, id: string): TransformResult => {
  if (!id.endsWith('.md')) return null;

  const content = new ExportedContent();

  const {
    data: { demos },
    contents,
  } = transformer.markdown(code, id);

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

  content.addContext(`import React from "react"\nconst ReactComponent = ${compiledReactCode}`);
  content.addExporting('ReactComponent');

  let exportDemos = '';

  demos.forEach((el, i) => {
    if (i === 0) exportDemos += '[';
    exportDemos += `{ name: ${JSON.stringify(el.name)}, title: ${JSON.stringify(el.title)}, component: ${el.code}},`;
    if (i === demos.length - 1) exportDemos += ']';
  });

  content.addContext(`const DemoBlocks = ${exportDemos}`);
  content.addExporting('DemoBlocks');

  return {
    code: content.export(),
  };
};

export const plugin = (): Plugin => {
  return {
    name: 'vite-plugin-markdown',
    enforce: 'pre',
    transform(code, id) {
      return tf(code, id);
    },
  };
};

export default plugin;
