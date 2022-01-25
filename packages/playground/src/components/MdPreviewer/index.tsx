import Highlight, { defaultProps } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import useCodeSandbox from './useCodeSandbox';
import useCopy from './useCopy';
import csbIcon from './csb.svg';
import copyIcon from './copy.svg';
import copyDoneIcon from './done.svg';
import './index.less';
import 'prismjs/themes/prism.css';

export type MDocPreviewerProps = {
  code: string;
  lang: string;
  key: string;
  dependencies: Record<
    string,
    {
      type: string;
      value: string;
      css: boolean;
    }
  >;
  meta: Record<string, any>;
};

const DefaultRender = (props: MDocPreviewerProps) => (
  <Highlight
    {...defaultProps}
    code={props.code}
    language={props.lang as Language}
    theme={undefined}
  >
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <pre className={className} style={style}>
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

const ActionsRender = (p: MDocPreviewerProps) => {
  const props = p || {};
  console.log(props);
  const openCsb = useCodeSandbox(props);
  const [copy, copyStatus] = useCopy();
  return (
    <div className="local-previewer">
      <DefaultRender {...props} />
      <div className="local-previewer__actions">
        {Object.keys(props?.dependencies || []).length ? (
          <button
            title="在codesandbox上尝试"
            className="local-previewer__btn local-previewer__csb"
            onClick={openCsb}
          >
            <img src={csbIcon} />
          </button>
        ) : null}
        <button
          title="复制"
          className="local-previewer__btn local-previewer__copy"
          onClick={() => copy(props.code)}
        >
          <img src={copyStatus === 'ready' ? copyIcon : copyDoneIcon} />
        </button>
      </div>
    </div>
  );
};

export default (props: MDocPreviewerProps) => {
  return <ActionsRender {...props} />;
};
