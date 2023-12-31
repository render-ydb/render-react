import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { updateFiberProps, DOMElement } from './SyntheticEvent';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
/* eslint-disable */
// @ts-ignore
export const createInstance = (type: string, props: Props): Instance => {
    const element = document.createElement(type) as unknown;
    updateFiberProps(element as DOMElement, props)
    return element as DOMElement;
}
/* eslint-disable */
// @ts-ignore
export const createTextInstance = (content: string) => {
  
    const element = document.createTextNode(content);
    console.log("content",element)
    return element;
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
            return commitTextUpdate(fiber.stateNode, text);
        case HostComponent:
            return updateFiberProps(fiber.stateNode, fiber.memoizedProps);
        default:
            if (__DEV__) {
                console.warn("未实现的Update", fiber);

            }
            break;
    }
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
    textInstance.textContent = content;
}

export function removeChild(child: Instance | TextInstance, container: Container) {
    container.removeChild(child);
}

export function insertChildToContainer(
    child: Instance,
    container: Container,
    before: Instance
) {
    container.insertBefore(child, before)
}

export const scheduleMicroTask =
    typeof queueMicrotask === 'function'
        ? queueMicrotask
        : typeof Promise === 'function'
            ? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
            : setTimeout;