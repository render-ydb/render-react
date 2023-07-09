import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {
    // 根据ReactElement创建一个fiber，并返回
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber

  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) {
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  }

  // 给fiber打上标志
  function placeSingleChild(fiber: FiberNode) {
    // 首屏渲染 && 需要追踪副作用
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement;
    }
    return fiber;
  }

  return function (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType | null,

  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiber, newChild),
          );

        default:
          if (__DEV__) {
            console.warn('为实现的reconcile类型', newChild)
          }
          break;
      }
    }
    // TODO 多节点 ul>li*3

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild),
      )
    }

    if (__DEV__) {
      console.warn('为实现的reconcile类型', newChild)
    }
    return null

  }
}

export const renconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);