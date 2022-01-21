import { normalizePath } from 'vite';
import jsyaml from 'js-yaml';

export default (source: string) => {
  let parsed: ReturnType<typeof jsyaml['safeLoad']>;
  try {
    parsed = jsyaml.load(source);
  } catch (err) {
    console.log(err);
  }
  const data: Record<string, any> = typeof parsed === 'object' ? parsed : {};
  // specialize for uuid, to avoid parse as number, error cases: 001, 1e10
  if (data.uuid !== undefined) {
    data.uuid = normalizePath(source).match(/(?:^|\n)\s*uuid:\s*([^\n]+)/)[1];
  }
  return data;
};
