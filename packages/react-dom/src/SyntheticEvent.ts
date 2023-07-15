import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__props';

const vaildEventList = ['click'];

type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
  __stopPropagation: boolean;
}

interface Paths {
  capture: Array<EventCallback>;
  bubble: Array<EventCallback>;
}

export interface DOMElement extends Element {
  [elementPropsKey]: Props;
}

export function updateFiberProps(node: DOMElement, props: Props) {
  node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
  if (!vaildEventList.includes(eventType)) {
    console.warn('当前不支持', eventType, '事件');

  }
  if (__DEV__) {
    console.log('初始化事件', eventType);
  }

  container.addEventListener(eventType, (e) => {
    dispatchEvent(container, eventType, e);
  })
}

function createSyntheticEvent(e: Event): SyntheticEvent {
  const syntheticEvent = e as SyntheticEvent;
  syntheticEvent.__stopPropagation = false;
  const originStopPropagation = e.stopPropagation;
  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true;
    originStopPropagation();
  }
  return syntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
  const tagetELement = e.target as DOMElement;
  if (tagetELement == null) {
    console.warn('事件不存在target', e);
    return;
  }
  // 1. 收集沿途的事件
  const { capture, bubble } = collectPaths(tagetELement, container, eventType)
  // 2. 构造合成事件
  const se = createSyntheticEvent(e);
  // 3. 遍历capture
  triggerEventFlow(capture, se)
  // 4. 遍历bubble
  if (!se.__stopPropagation) {
    triggerEventFlow(bubble, se)
  }

}

function triggerEventFlow(paths: Array<EventCallback>, se: SyntheticEvent) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i];
    callback.call(null, se);
    if (se.__stopPropagation) {
      break;
    }
  }
}

function getEventCallbackNameFromEventType(eventType: string): Array<string> | undefined {
  return {
    click: ['onClickCapture', 'onClick'],
  }[eventType]
}

function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
  const paths: Paths = {
    capture: [],
    bubble: [],
  }

  while (targetElement && targetElement !== container) {
    // 收集
    const elementProps = targetElement[elementPropsKey];
    if (elementProps) {
      const callbackNameList = getEventCallbackNameFromEventType(eventType);
      if (callbackNameList) {
        callbackNameList.forEach((callbackName, i) => {
          const eventCallback = elementProps[callbackName];
          if (eventCallback) {
            // 捕获阶段的事件
            if (i === 0) {
              paths.capture.unshift(eventCallback)
            } else {
              paths.bubble.push(eventCallback);
            }
          }
        })
      }
    }
    targetElement = targetElement.parentNode as DOMElement;
  }

  return paths;
}

