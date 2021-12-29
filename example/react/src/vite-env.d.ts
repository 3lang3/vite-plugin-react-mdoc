/// <reference types="vite/client" />

declare module '*.md' {
  // When "Mode.React" is requested. VFC could take a generic like React.VFC<{ MyComponent: TypeOfMyComponent }>
  import React from 'react'
  const ReactComponent: React.VFC;
  const DemoBlocks: any[];

  // Modify below per your usage
  export { ReactComponent, DemoBlocks };
}