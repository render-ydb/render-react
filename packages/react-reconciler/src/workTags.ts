export type WorkTag =
    | typeof FunctionConponent
    | typeof HostRoot
    | typeof HostComponent
    | typeof HostText
    | typeof Fragment;

// 函数组件
export const FunctionConponent = 0;
// 应用根节点, 比如ReactDom.render(rootElement,<APP/>)中Element对应的fiber节点类型
export const HostRoot = 3;
// 比如一个<div></div>组件对应的类型
export const HostComponent = 5;
// 文本组件
export const HostText = 6;

export const Fragment = 7;
