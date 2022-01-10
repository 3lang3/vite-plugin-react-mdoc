# vite-plugin-mdoc

A plugin enables you to import a Markdown file as various formats on your [vite](https://github.com/vitejs/vite) project.

## Setup

```
npm i -D vite-plugin-react-mdoc
```

### Config

```js
const mdoc = require('vite-plugin-react-mdoc')

module.exports = {
  plugins: [mdoc(options)]
}
```

Then you can import front matter attributes from `.md` file as default.

```md
---
title: Awesome Title
description: Describe this awesome content
tags:
  - "great"
  - "awesome"
  - "rad"
---

# This is awesome

Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with Rollup for production.
```

```ts
import { MdContent, MdDemos } from './doc.md';
```
### Type declarations

In TypeScript project, need to declare typedefs for `.md` file as you need.

```ts
declare module '*.md' {
  // When "Mode.React" is requested. VFC could take a generic like React.VFC<{ MyComponent: TypeOfMyComponent }>
  import React from 'react'
  const MdContent: React.VFC;
  const MdDemos: React.VFC[];

  // Modify below per your usage
  export { MdContent, MdDemos, };
}
```

Save as `vite.d.ts` for instance.

## License

MIT
