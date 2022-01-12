// test code tag

import React from 'react';
import  './style/code.less'

export default () => {
  const [count, setCount] = React.useState<number>(0);
  return (
    <>
      <img src="https://mir-s3-cdn-cf.behance.net/project_modules/max_632/274faa127009547.61390144590a7.png" />
      <button className="less_btn" onClick={() => setCount(v => v + 1)}>3111: {count}</button>
    </>
  );
};
