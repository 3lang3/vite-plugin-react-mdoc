export const winPath = (path: string) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
}


// 在windows环境下，很多工具都会把换行符lf自动改成crlf
// 为了测试精准需要将换行符转化一下
// https://github.com/cssmagic/blog/issues/22

export const isWindows =
  typeof process !== 'undefined' && process.platform === 'win32';

/**
 * Convert Windows crlf to lf (\r\n to \n)
 * @param content
 */
export const winEOL = (content: string | undefined) => {
  if (typeof content !== 'string') {
    return content;
  }
  return isWindows ? content.replace(/\r/g, '') : content;
};


export const withPath = (path: string) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
}