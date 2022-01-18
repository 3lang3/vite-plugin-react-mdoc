import fs from 'fs';
import path from 'path';

export function getPkgData(absPath: string) {
  const pkgPath = path.join(absPath, 'package.json');

  // use package.name if exists
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  }
  return undefined;
}

function getPkgAliasForPath(absPath: string) {
  const result: [string, string] = ['', absPath];
  const pkgPath = path.join(absPath, 'package.json');

  // use package.name if exists
  if (fs.existsSync(pkgPath)) {
    result[0] = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name;
  }

  return result;
}

export default () => {
  const pkgs: [string, string][] = [];

    // for standard repo
    pkgs.push(getPkgAliasForPath(process.cwd()));

  return pkgs;
};
