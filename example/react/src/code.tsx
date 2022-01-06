// test code tag

import React from 'react';

export default () => {
  const [count, setCount] = React.useState<number>(0);
  return (
    <button onClick={() => setCount(v => v + 1)}>
      3lang3: {count}
    </button>
  );
};
