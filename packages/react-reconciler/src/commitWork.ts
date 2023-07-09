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
    } else { // 不包含subtreeFlags副作用 或者 到了叶子节点
      // 向上遍历 先找兄弟，兄弟找不到，在找父节点
      while (nextEffect !== null) {
        commitMutationEffectOnFiber(nextEffect);
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
  appendPlacementNodeIntoContainer(finishedWork, hostParent)

}

// 寻找当前fiber节点对应的DOM可以插入的最近父节点（可能是祖先节点）
const getHostParent = (fiber: FiberNode) => {
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
    appendChildToContainer(finishedWork.stateNode, hostParent);
    return;
  }
  // 否则 向下遍历，找到符合条件的fiber
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);
    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }

  }
}