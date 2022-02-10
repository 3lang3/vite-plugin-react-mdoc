import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import rehype from './rehype';
import raw from './raw'
import slug from './slug';
import language from './language';
import meta from './meta';
import pre from './pre';
import code from './code.js';
import previewer from './previewer';
import jsxify from './jsxify';
import type { MDocDemoType } from '../types';
import { getPkgJsonForPath } from '../utils/moduleResolver';

const CWD = process.cwd();

type RemarkReturn = { demos: MDocDemoType[]; value: string; meta: Record<string, string>; slugs: { depth: number; text: string; id: string; }[] };

export default async function remark(source, id, viteConfig, pluginOptions): Promise<RemarkReturn> {
  const rootPkgJson = getPkgJsonForPath(CWD)
  const processor = await unified()
    .use(remarkParse)
    .use(slug)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(meta)
    .use(language)
    .use(rehype)
    .use(pre)
    .use(raw)
    .use(code)
    .use(previewer)
    .data('fileAbsPath', id)
    .data('viteConfig', viteConfig)
    .data('pluginOptions', pluginOptions)
    .data('rootPkgJson', rootPkgJson);

  processor.use(jsxify);

  const { data, value } = processor.processSync(source);
  const { demos = [], slugs, ...mdMeta } = data as (RemarkReturn & Record<string, string>)
  // console.log(value.toString());
  return { demos, slugs, meta: mdMeta, value: value.toString() };
}
