import React, { lazy, Suspense } from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import { ReactComponent, DemoBlocks } from './test.md';
import './App.css';

const DemoRender = () => {
  const blocks = DemoBlocks.map(el => ({ ...el, component: lazy(el.component) }));

  return (
    <div className="demo">
      {blocks.map(({ component: Com, ...el }) => (
        <div key={el.name}>
          {el.title && <h5>{el.title}</h5>}
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
              const {
                sources: { _ },
              } = props;
              const [[k, v]] = Object.entries(_);
              return (
                <Highlight {...defaultProps} code={v} language={k}>
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
