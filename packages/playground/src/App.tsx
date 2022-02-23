import MdComponent from './demo.md';
// import { Previewer as MdPreviewer } from 'mdoc-default-previewer';
import MdPreviewer from './components/MdPreviewer';
import './App.css';

const DemoRender = ({ demos }: any) => {
  return (
    <div className="demo">
      {demos.map(({ Component, key, ...props }: any) => (
        <div key={key}>
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
      <MdComponent>
        {({ MdContent, MdDemos }) => {
          return (
            <>
              <header className="App-header markdown">
                <MdContent
                  previewer={props => {
                    console.log(props)
                    return <MdPreviewer {...props} />;
                  }}
                />
              </header>
              <DemoRender demos={MdDemos} />
            </>
          );
        }}
      </MdComponent>
    </div>
  );
}

export default App;
