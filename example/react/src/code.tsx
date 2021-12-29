// test code tag

import React from 'react';
import { Button } from 'react-vant';

export default () => {
  const [count, setCount] = React.useState(0);
  return (
    <Button type="danger" onClick={() => setCount(v => v + 1)}>
      count: {count}
    </Button>
  );
};
