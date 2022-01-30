import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import useCodeSandbox from './useCodeSandbox';
import useCopy from './useCopy';
import FileIcon from './file.svg';
import CodeIcon from './code.svg';
import CsbIcon from './csb.svg';
import CopyIcon from './copy.svg';
import CopyDoneIcon from './done.svg';
import './index.less';
import './theme.less';
import { useMemo, useState } from 'react';

type DependenciesType = {
  type: string;
  value: string;
  css: boolean;
};

export type MDocPreviewerProps = {
  code: string;
  lang: string;
  key: string;
  dependencies: Record<string, DependenciesType>;
  meta: Record<string, any>;
  children: React.ReactNode;
};

/**
 * get source code type for file
 * @param file    file path
 * @param source  file source object
 */
function getSourceType(file: string) {
  // use file extension as source type first
  let type = file.match(/\.(\w+)$/)?.[1];

  return type || 'jsx';
}

const FileTabs = ({
  files,
  defaultCode,
  defaultLang,
}: {
  files: [string, DependenciesType][];
  defaultCode: string;
  defaultLang: string;
}) => {
  const [current, setCurrent] = useState<any>({
    code: defaultCode,
    lang: defaultLang,
  });

  const code = useMemo(() => current.code, [current]);
  const lang = useMemo(() => current.lang, [current]);

  return (
    <div className="default-previewer__tabs">
      {files.map(([filename, info]) => {
        return (
          <div
            key={filename}
            onClick={() =>
              setCurrent({ code: info.value, lang: getSourceType(filename) })
            }
            className="default-previewer__tabs-plane"
          >
            <FileIcon /> {filename}
          </div>
        );
      })}
      <DefaultRender code={code} lang={lang} />
    </div>
  );
};

const DefaultRender = ({
  code,
  lang,
  showCopy,
}: {
  code: string;
  lang: string;
  showCopy?: boolean;
}) => {
  const [copy, copyStatus] = useCopy();
  return (
    <Highlight
      {...defaultProps}
      code={code}
      language={lang as Language}
      theme={undefined}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} default-pre`} style={style}>
          {showCopy && (
            <button
              title="复制"
              className="default-pre__btn"
              onClick={() => copy(code)}
            >
              {copyStatus === 'ready' ? <CopyIcon /> : <CopyDoneIcon />}
            </button>
          )}
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

export default ({ children, ...props }: MDocPreviewerProps) => {
  const dependenciesArr = useMemo(
    () => Object.entries(props.dependencies || []),
    [props.dependencies],
  );
  const files = useMemo(
    () => dependenciesArr.filter(([_, el]) => el.type === 'FILE'),
    [dependenciesArr],
  );

  const hasDeps = Object.keys(props?.dependencies || []).length > 0;

  const openCsb = useCodeSandbox(props);
  const [copy, copyStatus] = useCopy();
  const [showSource, setShowSource] = useState(hasDeps && !children);

  return hasDeps ? (
    <div className="default-previewer">
      {children && <div className="default-previewer__demo">{children}</div>}
      <div className="default-previewer__actions">
        {Object.keys(props?.dependencies || []).length ? (
          <button
            title="在codesandbox上尝试"
            className="default-previewer__btn default-previewer__csb"
            onClick={openCsb}
          >
            <CsbIcon />
          </button>
        ) : null}
        <button
          title="复制"
          className="default-previewer__btn default-previewer__copy"
          onClick={() => copy(props.code)}
        >
          {copyStatus === 'ready' ? <CopyIcon /> : <CopyDoneIcon />}
        </button>
        <button
          className="default-previewer__btn"
          onClick={() => setShowSource(v => !v)}
        >
          <CodeIcon />
        </button>
      </div>

      {showSource && (
        <div className="default-previewer__source">
          {files.length === 1 ? (
            <DefaultRender {...props} />
          ) : (
            <FileTabs
              files={files}
              defaultCode={props.code}
              defaultLang={props.lang}
            />
          )}
        </div>
      )}
    </div>
  ) : (
    <DefaultRender {...props} showCopy />
  );
};
