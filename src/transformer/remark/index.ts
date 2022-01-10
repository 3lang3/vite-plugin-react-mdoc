import path from 'path';
import createDebug from 'debug';
import type { Transformer } from 'unified';
import type { Node } from 'unist';
import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import stringify from 'rehype-stringify';
import raw from './raw';
import code from './code';
import rehype from './rehype';
import jsxify from './jsxify';
import meta from './meta';
import sourceCode from './sourceCode';
import codeBlock from './codeBlock';
import previewer from './previewer';

const log = createDebug('dumi:remark');

log('name');

function debug(name: string) {
  return function debugPlugin() {
    return () => {
      if (this.data('fileAbsPath')) {
        log(name, this.data('fileAbsPath'));
      }
    };
  };
}

export default (source: string, fileAbsPath: string, type: 'jsx' | 'html', masterKey?: string) => {
  const rehypeCompiler = {
    jsx: [jsxify],
    html: [stringify, { allowDangerousHtml: true, closeSelfClosing: true }],
  }[type] as any;

  const processor = unified()
    .use(remarkParse)
    .use(debug('parse'))
    .use(remarkGfm)
    .use(debug('gfm'))
    .use(remarkFrontmatter)
    .use(debug('frontmatter'))
    .use(meta)
    .use(debug('meta'))
    .use(codeBlock)
    .use(debug('codeBlock'))
    .use(rehype)
    .use(debug('rehype'))
    .use(sourceCode)
    .use(debug('sourceCode'))
    .use(raw)
    .use(debug('raw'))
    .use(code)
    .use(debug('code'))
    .use(previewer)
    .use(debug('previewer'))
    .data('masterKey', masterKey)
    .data('fileAbsPath', fileAbsPath)

  // apply compiler via type
  processor.use(rehypeCompiler[0], rehypeCompiler[1]);
  const file = processor.processSync(source);

  file.path = path.dirname(path.join(__dirname, 'src'));
  file.extname = '.tsx';

  return file as any;
};

interface IDumiVFileData {
  /**
   * markdown file path base cwd
   */
  filePath?: string;
  /**
   * markdown file updated time in git history, fallback to file updated time
   */
  updatedTime?: number;
  /**
   * the related component name of markdown file
   */
  componentName?: string;
  /**
   * page title
   */
  title?: string;
  /**
   * component keywords
   */
  keywords?: string[];
  /**
   * mark component deprecated
   */
  deprecated?: true;
  /**
   * component uuid (for HiTu)
   */
  uuid?: string;
  /**
   * slug list in markdown file
   */
  slugs?: {
    depth: number;
    value: string;
    heading: string;
  }[];
}

// reserve unknown property for Node, to avoid custom plugin throw type error after @types/unist@2.0.4
declare module 'unist' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/no-shadow
  export interface Node {
    [key: string]: unknown;
  }
}

export interface YamlNode extends Node {
  type: string;
  value: string;
}

export interface IDumiElmNode extends Node {
  properties: {
    id?: string;
    href?: string;
    [key: string]: any;
  };
  tagName: string;
  children?: IDumiElmNode[];
}

export type IDumiUnifiedTransformer = (
  node: Parameters<Transformer>[0],
  vFile: Parameters<Transformer>[1] & { data: IDumiVFileData },
  next?: Parameters<Transformer>[2],
) => ReturnType<Transformer>;
