import { Props, ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement, createWorkInProgress } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {

  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags != ChildDeletion;
    } else {
      returnFiber.deletions?.push(childToDelete);
    }

  }

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {

    // update
    work: if (currentFiber !== null) {
      const key = element.key;
      if (currentFiber.key === key) { // key相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) { // type相同
            // 复用当前fiber
            const existing = useFiber(currentFiber, element.props);
            existing.return = returnFiber;
            return existing
          }
          // 删除旧fiber
          deleteChild(returnFiber, currentFiber);
          break work;
        } else if (__DEV__) {
          console.warn('为实现的react类型');
          break work;
        }
      } else {
        // 删除旧fiber
        deleteChild(returnFiber, currentFiber);
      }
    }


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
    // update
    if (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        // 类型没有改变
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        return existing;
      }
      deleteChild(returnFiber, currentFiber);
    }

    // mount
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

    // 兜底删除
    if (currentFiber) {
      deleteChild(returnFiber, currentFiber);
      return null;
    }

    if (__DEV__) {
      console.warn('为实现的reconcile类型', newChild)
    }
    return null

  }
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

export const renconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);