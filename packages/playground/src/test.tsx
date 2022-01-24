import React from 'react';
import Test1 from './test1';
import './App.css';

export default () => {
  const [count, setCount] = React.useState(0);
  return (
    <>
      <Test1 />
      <button onClick={() => setCount(v => v + 1)}>code tag: {count}</button>
    </>
  );
};