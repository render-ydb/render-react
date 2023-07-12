import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
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


export const commitUpdate = (fiber: FiberNode) => {
    switch (fiber.tag) {
        case HostText:
            const text = fiber.memoizedProps.content;
            commitTextUpdate(fiber.stateNode,text);
            break;
        case HostComponent:

            break;

        default:
            if (__DEV__) {
                console.warn("未实现的Update",fiber);
                
            }
            break;
    }
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
    textInstance.textContent = content;
}

export function removeChild(child:Instance|TextInstance,container:Container) {
    container.removeChild(child);
}