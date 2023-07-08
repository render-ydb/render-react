export type WorkTag =
    | typeof FunctionConponent
    | typeof HostRoot
    | typeof HostComponent
    | typeof HostText;

// 函数组件
export const FunctionConponent = 0;
// 应用根节点, 比如ReactDom.render(<APP/>)中APP组件
export const HostRoot = 3;
// 比如一个<div></div>组件对应的类型
export const HostComponent = 5;
// 文本组件
export const HostText = 6;
