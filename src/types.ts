/* eslint-disable no-use-before-define */
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
}

export interface ResolvedOptions extends Required<Options> {
  wrapperClasses: string
}


export type DemoType = {
  id: string;
  name: string;
  title?: string;
  code: string;
  filePath?: string;
  language?: string;
  previewerProps: any;
  dependencies?: Record<
    string,
    {
      type: string;
      value: string;
    }
  >;
};