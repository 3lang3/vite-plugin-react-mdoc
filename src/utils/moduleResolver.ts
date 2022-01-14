import fs from 'fs';
import path from 'path';
import slash from 'slash2';
import resolve from 'enhanced-resolve';
import getHostPkgAlias from './getHostPkgAlias';
import ctx from '../context';

const DEFAULT_EXT = ['.tsx', '.jsx'];

interface IModuleResolverOpts {
  basePath: string;
  sourcePath: string;
  extensions?: string[];
  silent?: boolean;
  viteConfig?: any;
}

/**
 * get package related paths from source path
 * @param identifier  module path, such as dumi/lib/a.js or /path/to/node_modules/dumi/lib/a.js
 */
const getPkgPathsFromPath = (identifier: string) => {
  const matches = identifier.match(/^(.*node_modules)\/((?:@[^/]+\/)?[^/]+)/) || [];

  return {
    absSourcePath: identifier,
    absPkgModulePath: matches[0],
    absNodeModulesPath: matches[1],
    pkgName: matches[2],
  };
};

/**
 * get package root path if it is a local package
 * @param pkg   package name
 */
const getHostPkgPath = (() => {
  let cache: ReturnType<typeof getHostPkgAlias>;

  return (pkg: string) => {
    if (!cache) {
      cache = getHostPkgAlias();
    }

    return cache.find(([name]) => name === pkg)?.[1];
  };
})();

/**
 * resolve module path base on umi context (alias)
 */
export const getModuleResolvePath = ({
  basePath,
  sourcePath,
  extensions = DEFAULT_EXT,
  silent,
  viteConfig,
}: IModuleResolverOpts) => {
  // treat local packages as 3rd-party module for collect as dependencies
  if (/^[a-z]@/.test(sourcePath) && getHostPkgPath(getPkgPathsFromPath(sourcePath).pkgName)) {
    return slash(path.join(ctx.umi.paths.absNodeModulesPath, sourcePath));
  }

  try {
    console.log(viteConfig?.resolve?.alias)
    return slash(
      resolve.create.sync({
        extensions,
        alias: viteConfig?.resolve?.alias,
        symlinks: false,
        mainFiles: ['index', 'package.json'],
      })(fs.statSync(basePath).isDirectory() ? basePath : path.parse(basePath).dir, sourcePath),
    );
  } catch (err) {
    if (!silent) console.error(`[dumi]: cannot resolve module ${sourcePath} from ${basePath}`);
    return ''
    // throw err;
  }
};

/**
 * resolve module version
 */
export const getModuleResolvePkg = ({
  basePath,
  sourcePath,
  extensions = DEFAULT_EXT,
}: IModuleResolverOpts) => {
  let version: string | null;
  let name: string | null;
  let peerDependencies;
  const resolvePath = getModuleResolvePath({ basePath, sourcePath, extensions });
  const { pkgName, absPkgModulePath } = getPkgPathsFromPath(resolvePath);
  // use project path as module path for local packages
  const modulePath = getHostPkgPath(pkgName) || absPkgModulePath;
  const pkgPath = path.join(modulePath, 'package.json');
  if (modulePath && fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    version = pkg.version;
    name = pkg.name;
    peerDependencies = pkg.peerDependencies;
  } else {
    ctx.umi?.logger.error(`[dumi]: cannot find valid package.json for module ${modulePath}`);
  }

  return { name, version, peerDependencies };
};

/**
 * resolve module content
 */
export const getModuleResolveContent = ({
  basePath,
  sourcePath,
  extensions = DEFAULT_EXT,
}: IModuleResolverOpts) => {
  const resolvePath = getModuleResolvePath({ basePath, sourcePath, extensions });

  return resolvePath ? fs.readFileSync(resolvePath, 'utf8').toString() : '';
};
