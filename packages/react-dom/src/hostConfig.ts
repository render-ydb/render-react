
export type Container = Element;
export type Instance = Element;
/* eslint-disable */
// @ts-ignore
export const createInstance = (type: string, props: any): Instance => {
    // TODO 处理props
    const element = document.createElement(type);
    return element;
}
/* eslint-disable */
// @ts-ignore
export const createTextInstance = (content: string) => {
    return document.createTextNode(content);
}
/* eslint-disable */
// @ts-ignore
export const appendInitialChild = (
    parent: Instance | Container,
    child: Instance
) => {
    parent.appendChild(child);
}

/* eslint-disable */
// @ts-ignore
export const appendChildToContainer = appendInitialChild;

