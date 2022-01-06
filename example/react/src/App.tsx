import { lazy, Suspense } from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import { ReactComponent, DemoBlocks } from './test.md';
import './App.css';

const DemoRender = () => {
  return (
    <div className="demo">
      {DemoBlocks.map((Com, i) => (
        <div key={i}>
          <Com />
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <div className="App">
        <header className="App-header">
          <ReactComponent
            previewer={props => {
              return (
                <Highlight {...defaultProps} code={props.code} language={props.language as Language}>
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
            }}
          />
        </header>
        <DemoRender />
      </div>
    </Suspense>
  );
}

export default App;
