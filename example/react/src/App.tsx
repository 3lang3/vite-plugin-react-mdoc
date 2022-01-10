import { Suspense } from 'react';
import MdPreviewer from './components/MdPreviewer';
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
