# Steps 步骤条

### 介绍

用于展示操作流程的各个环节，让用户了解当前的操作在整体流程中的位置。

### 引入

```js
import { Step, Steps } from 'react-vant';
```

## 代码演示

### 基础用法

`active` 属性表示当前步骤的索引，从 0 起计。

```html
import { useState } from 'react';
import { Steps } from 'react-vant';

export default () => {
  const [active, setActive] = useState(0);
  return (
    <Steps active={active}>
      <Steps.Item>买家下单</Steps.Item>
      <Steps.Item>商家接单</Steps.Item>
      <Steps.Item>买家提货</Steps.Item>
      <Steps.Item>交易完成</Steps.Item>
    </Steps>
  );
};
```

### 自定义样式

可以通过 `activeIcon` 和 `activeColor` 属性设置激活状态下的图标和颜色。

```html
<Steps active={active} activeIcon={<Success />} activeColor="#38f">
  <Steps.Item>买家下单</Steps.Item>
  <Steps.Item>商家接单</Steps.Item>
  <Steps.Item>买家提货</Steps.Item>
  <Steps.Item>交易完成</Steps.Item>
</Steps>
```
