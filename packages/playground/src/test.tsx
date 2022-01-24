import React from 'react';

export default () => {
  const [count, setCount] = React.useState(0)
  return (
    <button onClick={() => setCount(v => v + 1)}>code tag: {count}</button>
  )
}