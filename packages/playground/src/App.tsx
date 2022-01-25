import { MdContent, MdDemos } from './demo.md';
import MdPreviewer from './components/MdPreviewer';
import './App.css';


const DemoRender = () => {
  return (
    <div className="demo">
      {MdDemos.map(({ Component, ...props }) => (
        <div key={props.id}>
          {props.title && <h4>{props.title}</h4>}
          <Component />
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <header className="App-header markdown">
        <MdContent
          previewer={props => {
            // console.log(props);
            return <MdPreviewer {...props} />;
          }}
        />
      </header>
      <DemoRender />
    </div>
  );
}

export default App;
