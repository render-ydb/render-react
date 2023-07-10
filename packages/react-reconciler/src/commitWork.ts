import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';
import { Container, appendChildToContainer } from 'hostConfig';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork;
  while (nextEffect !== null) {
    // 向下遍历
    const child: FiberNode | null = nextEffect.child;

    // 当前fiber节点上存在副作用，继续向下遍历
    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      child !== null
    ) {
      nextEffect = child;
    } else {
      // 进入这里说明当前fiber没有subtreeFlags副作用了，也就是当前节点可能包含flags或者找到叶子节点
      while (nextEffect !== null) {
        commitMutationEffectOnFiber(nextEffect);
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

// 处理符合条件的fiber的flags
const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {
  const flags = finishedWork.flags;

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    // 从flags中移除Placement标志
    finishedWork.flags &= ~Placement;
  }
}

const commitPlacement = (finishedWork: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Placement操作', finishedWork)
  }

  // parent Dom
  const hostParent = getHostParent(finishedWork);
  // finishedWork Dom
  if (hostParent !== null) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent)
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

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
) {
  // 找到当前fiber节点对应的stateNode

  // 满足条件直接插入
  if (
    (finishedWork.tag === HostComponent) ||
    (finishedWork.tag === HostText)
  ) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }

  // 可能是<APP/> 这种类型的组件，需要寻找其child
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);
    // 还需要把child的兄弟节点也插入到hostParent中去，
    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }

  }
}