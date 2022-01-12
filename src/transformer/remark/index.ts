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


export default (source: string, fileAbsPath: string, type: 'jsx' | 'html', masterKey?: string) => {
  const rehypeCompiler = {
    jsx: [jsxify],
    html: [stringify, { allowDangerousHtml: true, closeSelfClosing: true }],
  }[type] as any;

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(meta)
    .use(codeBlock)
    .use(rehype)
    .use(sourceCode)
    .use(raw)
    .use(code)
    .use(previewer)
    .data('masterKey', masterKey)
    .data('fileAbsPath', fileAbsPath)

  // apply compiler via type
  processor.use(rehypeCompiler[0], rehypeCompiler[1]);
  const file = processor.processSync(source);

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
