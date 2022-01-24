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

export default async function remark(source, id, viteConfig, pluginOptions): Promise<string> {
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
    .data('pluginOptions', pluginOptions);

  processor.use(jsxify);

  const file = processor.processSync(source);
  const fileSource = String(file)

  console.log(fileSource);
  return fileSource;
}
