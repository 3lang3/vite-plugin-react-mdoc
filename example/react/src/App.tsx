import { Suspense } from 'react';
import MdPreviewer from './components/MdPreviewer';
// import { MdContent, MdDemos } from './test.md';
import { MdContent, MdDemos } from '/Users/3lang/Workspace/zhp/react-vant/packages/react-vant/docs/markdown/advanced-usage.zh-CN.md';
import './App.css';

const DemoRender = () => {
  return (
    <div className="demo">
      {MdDemos.map((Demo) => (
        <div key={Demo.id}>
          <h4>{Demo.title}</h4>
          <Demo.Component />
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
          <MdContent
            previewer={props => {
              console.log(props)
              return <MdPreviewer {...props} />
            }}
          />
        </header>
        <DemoRender />
      </div>
    </Suspense>
  );
}

export default App;
