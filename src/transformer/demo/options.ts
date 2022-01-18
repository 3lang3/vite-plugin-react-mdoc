export interface IDemoOpts {
  isTSX: boolean;
  fileAbsPath: string;
  transformRuntime?: any;
}

export const getBabelOptions = ({ isTSX, fileAbsPath, transformRuntime }: IDemoOpts) => ({
  // rename filename.md to filename.tsx to prevent babel transform failed
  filename: fileAbsPath.replace(/\.md$/, isTSX ? '.tsx' : '.jsx'),
  presets: [require.resolve('@babel/preset-typescript')],
  // plugins: [
  //   [require.resolve('@babel/plugin-transform-modules-commonjs'), { strict: true }],
  // ],
  ast: true,
  babelrc: false,
  configFile: false,
});
