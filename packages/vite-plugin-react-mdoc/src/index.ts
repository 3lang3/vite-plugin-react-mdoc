import { createFilter } from '@rollup/pluginutils';
import type { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'vite';
import remark from './remark';

const PLUGIN_NAME = 'vite-plugin-react-mdoc';

const viteConfig = {
  resolve: {
    alias: {
      'react': '/Users/3lang/Workspace/zhp/xs/xs-h5-shopv2/node_modules/react',
      'react-vant': '/Users/3lang/Workspace/github/react-vant/packages/react-vant/src'
    }
  }
}

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  root?: string;
  previewLangs?: string[];
  localPkgs?: Record<string, { version: string }>;
}

const pluginOptions: Options = {
  include: /\.md$/,
  previewLangs: ['jsx', 'tsx'],
  localPkgs: {
    'react-vant': {
      version: '2.0.0'
    }
  }
}

const plugin = (userOptions: Options = pluginOptions): Plugin => {
  const filter = createFilter(userOptions.include || /\.md$/, userOptions.exclude);

  return {
    name: PLUGIN_NAME,
    async transform(code, id) {
      if (filter(id)) {
        await remark(code, id, viteConfig, pluginOptions)
        return { code: '' };
      }
    },
  };
};

export default plugin;
