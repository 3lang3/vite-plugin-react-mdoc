import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/*.mts'],
  outbase: 'src',
  outdir: 'dist',
  format: 'esm',
  outExtension: {
    '.js': '.mjs'
  },
  watch: true,
  color: true,
})