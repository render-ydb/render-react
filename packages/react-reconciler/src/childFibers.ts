import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement, createWorkInProgress, createFiberFromFragment } from './fiber';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Fragment, HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';


type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {

  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions?.push(childToDelete);
    }

  }

  function deleteRemainingChildren(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
  ) {
    if (!shouldTrackEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {
    // update
    const key = element.key;
    while (currentFiber !== null) {
      if (currentFiber.key === key) { // key相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) { // type相同
            let props = element.props;
            if (element.type === REACT_FRAGMENT_TYPE) {
              props = element.props.children;
            }
            // 复用当前fiber
            const existing = useFiber(currentFiber, props);
            existing.return = returnFiber;
            // 当前节点可复用, 标记剩下的节点删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existing
          }
          // key相同，type不同，删除所有旧的
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else if (__DEV__) {
          console.warn('为实现的react类型');
          break;
        }
      } else {
        // key不同
        deleteChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }
    // 根据ReactElement创建一个fiber，并返回
    let fiber;
    if (element.type === REACT_FRAGMENT_TYPE) {
      fiber = createFiberFromFragment(element.props.children, element.key);
    } else {
      fiber = createFiberFromElement(element)
    }
    fiber.return = returnFiber;
    return fiber

  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) {
    // update
    while (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        // 类型没有改变
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      }
      deleteChild(returnFiber, currentFiber);
      currentFiber = currentFiber.sibling;
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

  function reconcileChildrenArray(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild: any[],
  ) {

    // 最后一个可复用fiber在current中的index
    let lastPlaceIndex: number = 0;
    // 创建的最后一个fiber
    let lastNewFiber: FiberNode | null = null;
    // 创建的第一个fiber
    let fistNewFiber: FiberNode | null = null;

    // 1.将current保存到Map中
    const existringChildren: ExistingChildren = new Map();
    let current = currentFirstChild;
    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index;
      existringChildren.set(keyToUse, current);
      current = current.sibling;
    }

    for (let i = 0; i < newChild.length; i++) {
      // 2.遍历newChild,寻找是否可复用
      const after = newChild[i];
      const newFiber = updateFromMap(
        returnFiber,
        existringChildren,
        i,
        after,
      );
      if (newFiber === null) {
        continue;
      }
      // 3.标记移动还是插入
      newFiber.index = i;
      newFiber.return = returnFiber;

      if (lastNewFiber === null) {
        lastNewFiber = newFiber;
        fistNewFiber = newFiber;
      } else {
        lastNewFiber.sibling = newFiber;
        lastNewFiber = lastNewFiber.sibling;
      }

      if (!shouldTrackEffects) {
        continue;
      }

      const oldFiber = newFiber.alternate;
      if (oldFiber !== null) {
        const oldIndex = oldFiber.index;
        if (oldIndex < lastPlaceIndex) {
          // 移动
          console.log('newfiber', newFiber)
          newFiber.flags |= Placement;
          continue;
        } else {
          lastPlaceIndex = oldIndex;
        }
      } else {
        // 插入
        newFiber.flags |= Placement;
      }

    }

    // 将Map中剩下的标记为删除
    existringChildren.forEach(fiber => {
      deleteChild(returnFiber, fiber)
    });

    return fistNewFiber;

  }

  function updateFromMap(
    returnFiber: FiberNode,
    existringChildren: ExistingChildren,
    index: number,
    element: any,
  ): FiberNode | null {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existringChildren.get(keyToUse);

    // HostText
    if (typeof element === 'string' || typeof element === 'number') {
      if (before) {
        if (before.tag === HostText) {
          existringChildren.delete(keyToUse);
          return useFiber(before, element + '');
        }
      }
      return new FiberNode(HostText, { content: element + '' }, null);
    }

    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (element.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              before,
              element,
              keyToUse,
              existringChildren,
            );
          }
          if (before) {
            if (before.type === element.type) {
              existringChildren.delete(keyToUse);
              return useFiber(before, element.props)
            }
          }
          return createFiberFromElement(element)
      }

      // if (Array.isArray(element) && __DEV__) {
      //   console.log("element", element)
      //   console.warn('还为未实现数组类型的child');
      // }
    }

    if (Array.isArray(element)) {
      return updateFragment(
        returnFiber,
        before,
        element,
        keyToUse,
        existringChildren,
      ) as FiberNode | null
    }
    return null;
  }

  return function (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: any,

  ) {
    // 判断fragment
    const isUnkeyedTopLevelFrgment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;
    if (isUnkeyedTopLevelFrgment) {
      newChild = newChild.props.child;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      // 多节点 ul>li*3
      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(
          returnFiber,
          currentFiber,
          newChild,
        )
      }
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


    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild),
      )
    }

    // 兜底删除
    if (currentFiber !== null) {
      deleteRemainingChildren(returnFiber, currentFiber);
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


function updateFragment(
  returnFiber: FiberNode,
  current: FiberNode | undefined,
  elements: any[],
  key: Key,
  existringChildren: ExistingChildren,
): FiberNode | null {
  let fiber: FiberNode;
  if (!current || current.tag !== Fragment) {
    fiber = createFiberFromFragment(elements, key);
  } else {
    existringChildren.delete(key);
    fiber = useFiber(current, elements);
  }
  fiber.return = returnFiber;
  return fiber;
}

export const renconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);