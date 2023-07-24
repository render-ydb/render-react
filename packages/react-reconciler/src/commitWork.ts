import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import { ChildDeletion, Flags, LayoutMask, MutationMask, NoFlags, PassiveEffect, PassiveMask, Placement, Ref, Update } from './fiberFlags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';
import { FunctionConponent, HostComponent, HostRoot, HostText } from './workTags';
import { Container, Instance, appendChildToContainer, commitUpdate, insertChildToContainer, removeChild } from 'hostConfig';

let nextEffect: FiberNode | null = null;

const commitEffects = (
  phrase: 'mutation' | 'layout',
  mask: Flags,
  callback: (fiber: FiberNode, root: FiberRootNode) => void,
) => {
  return (
    finishedWork: FiberNode,
    root: FiberRootNode,
  ) => {
    nextEffect = finishedWork;
    while (nextEffect !== null) {
      // 向下遍历
      const child: FiberNode | null = nextEffect.child;

      // 当前fiber节点上存在副作用，继续向下遍历
      if (
        (nextEffect.subtreeFlags & mask) !== NoFlags &&
        child !== null
      ) {
        nextEffect = child;
      } else {
        while (nextEffect !== null) {
          callback(nextEffect, root);
          // 看看是不是兄弟节点有副作用
          const sibling: FiberNode | null = nextEffect.sibling;
          if (sibling !== null) {
            nextEffect = sibling;
            break;
          }
          nextEffect = nextEffect.return;
        }
      }
    }
  }
}
// 处理符合条件的fiber的flags
const commitMutationEffectOnFiber = (finishedWork: FiberNode, root: FiberRootNode) => {
  const { flags, tag } = finishedWork;

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }

  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions;
    if (deletions !== null) {
      deletions.forEach(childToDelete => {
        commitDeletion(childToDelete, root)
      })
    }
    finishedWork.flags &= ~ChildDeletion;
  }

  if ((flags & PassiveEffect) !== NoFlags) {
    commitPassiveEffect(finishedWork, root, 'update');
    finishedWork.flags &= ~PassiveEffect;
  }

  if ((flags & Ref) !== NoFlags && tag === HostComponent) {
    // 解绑ref
    safelyDetachRef(finishedWork);

  }
}

function safelyDetachRef(current: FiberNode) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
      ref(null)
    } else {
      ref.current = null
    }
  }
}

export const commitMutationEffects = commitEffects(
  'mutation',
  MutationMask | PassiveMask,
  commitMutationEffectOnFiber,
)
const commitLayoutEffectOnFiber = (finishedWork: FiberNode, root: FiberRootNode) => {
  const { flags, tag } = finishedWork;
  if ((flags & Ref) !== NoFlags && tag === HostComponent) {
    // 绑定新的ref
    safelyAttachRef(finishedWork);
    finishedWork.flags &= ~Ref;
  }
}
function safelyAttachRef(fiber: FiberNode) {
  const ref = fiber.ref;
  if (ref !== null) {
    const instance = fiber.stateNode;
    if (typeof ref === 'function') {
      ref(instance)
    } else {
      ref.current = instance
    }
  }
}

export const commitLayoutEffects = commitEffects(
  'layout',
  LayoutMask,
  commitLayoutEffectOnFiber,
)

//  收集effect
function commitPassiveEffect(
  fiber: FiberNode,
  root: FiberRootNode,
  type: keyof PendingPassiveEffects,
) {
  // update unmount
  if (
    fiber.tag !== FunctionConponent ||
    (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
  ) {
    return
  }
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
  if (updateQueue !== null) {
    if (updateQueue.lastEffect === null && __DEV__) {
      console.error('当FC存在PassiveEffect flag时，不应该不存在effect');
    } else {
      root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect);
    }

  }
}
function commitHookEffectList(
  flags: Flags,
  laseEffect: Effect,
  callback: (effect: Effect) => void,
) {
  let effect = laseEffect.next as Effect;
  do {
    if ((effect.tags & flags) === flags) {
      callback(effect);
    }
    effect = effect.next as Effect;
  } while (effect !== laseEffect.next);
}

export function commitHookEffectListUnmount(
  flags: Flags,
  laseEffect: Effect,
) {
  commitHookEffectList(flags, laseEffect, effect => {
    const destroy = effect.destroy;
    if (typeof destroy === 'function') {
      destroy();
    }
    // 函数组件已经被卸载了，对应的create函数不会触发
    effect.tags &= ~HookHasEffect;
  })
}

export function commitHookEffectListDestroy(
  flags: Flags,
  laseEffect: Effect,
) {
  commitHookEffectList(flags, laseEffect, effect => {
    const destroy = effect.destroy;
    if (typeof destroy === 'function') {
      destroy();
    }
  })
}

export function commitHookEffectListCreate(
  flags: Flags,
  laseEffect: Effect,
) {
  commitHookEffectList(flags, laseEffect, effect => {
    const create = effect.create;
    if (typeof create === 'function') {
      effect.destroy = create();
    }
  })
}


function recordHostChildrenToDelete(
  childToDelete: Array<FiberNode>,
  unmountFiber: FiberNode,
) {
  // 1. 找到第一个root host节点
  let lastOne = childToDelete[childToDelete.length - 1];
  // 2. 每找到一个host节点，判断是不是1步的兄弟节点
  if (!lastOne) {
    childToDelete.push(unmountFiber);
  } else {
    let node = lastOne.sibling;
    while (node !== null) {
      if (unmountFiber === node) {
        childToDelete.push(unmountFiber);
      }
      node = node.sibling;
    }
  }

}


function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {

  const rootChildrenToDelete: Array<FiberNode> = [];
  // 递归子树
  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
        // 解绑ref
        safelyDetachRef(unmountFiber)
        return;

      case HostText:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
        return;
      case FunctionConponent:
        // TODO 解绑ref
        commitPassiveEffect(unmountFiber, root, 'unmount');
        return;

      default:
        if (__DEV__) {
          console.warn('未实现的ummount', unmountFiber);

        }
    }
  });

  // 移除rootHostNode的DOM
  if (rootChildrenToDelete.length) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      rootChildrenToDelete.forEach(node => {
        removeChild(node.stateNode, hostParent)
      })

    }
  }
  // GC
  childToDelete.return = null;
  childToDelete.child = null;
}

function commitNestedComponent(
  root: FiberNode,
  onCommitUnmont: (fibber: FiberNode) => void,
) {
  let node = root;
  while (true) {
    onCommitUnmont(node);
    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === root) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

  }
}


const commitPlacement = (finishedWork: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Placement操作', finishedWork)
  }

  // parent Dom
  const hostParent = getHostParent(finishedWork);

  // host sibling
  const sibling = getHostSibling(finishedWork);

  // finishedWork Dom
  if (hostParent !== null) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling)
  }
}

function getHostSibling(fibber: FiberNode): Instance | null {
  let node: FiberNode = fibber;
  console.log('fibber', fibber)
  findSibling: while (true) {

    while (node.sibling === null) {
      const parent = node.return;
      if (parent === null || parent.tag === HostComponent || parent.tag === HostText
      ) {
        return null;
      }
      node = parent;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== HostText && node.tag !== HostComponent) {
      // 向下遍历
      if ((node.flags & Placement) !== NoFlags) { // 当前节点不稳定
        continue findSibling;
      }
      if (node.child === null) {
        continue findSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    if ((node.flags & Placement) === NoFlags) {
      return node.stateNode
    }
  }
}

// 寻找当前fiber节点对应的DOM可以插入的最近父节点（可能是祖先节点）
const getHostParent = (fiber: FiberNode): Container | null => {
  let parent = fiber.return;
  while (parent) {
    const parentTag = parent.tag;
    if (parentTag === HostComponent) {
      return parent.stateNode as Container;
    }

    if (parentTag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
    parent = parent.return;
  }
  if (__DEV__) {
    console.warn('未找到 host parent')
  }
  return null
}

function insertOrAppendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance | null,
) {
  // 找到当前fiber节点对应的stateNode

  // 满足条件直接插入
  if (
    (finishedWork.tag === HostComponent) ||
    (finishedWork.tag === HostText)
  ) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      appendChildToContainer(hostParent, finishedWork.stateNode);
    }

    return;
  }

  // 可能是<APP/> 这种类型的组件，需要寻找其child
  const child = finishedWork.child;
  if (child !== null) {
    insertOrAppendPlacementNodeIntoContainer(child, hostParent);
    // 还需要把child的兄弟节点也插入到hostParent中去，
    let sibling = child.sibling;
    while (sibling !== null) {
      insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }

  }
}