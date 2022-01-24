---
title = "New Website"
---

# hello world!

this is a vite plugin project.

```html
<div>this is div tag</div>
```

```jsx
/**
 * title: hello
 */

import React from 'react';

export default () => {
  const [count, setCount] = React.useState(0)
  return (
    <button onClick={() => setCount(v => v + 1)}>count: {count}</button>
  )
}
```

<code title="codeTag" src="./test.tsx" />