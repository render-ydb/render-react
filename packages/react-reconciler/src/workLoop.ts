import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';

let workInProgress: FiberNode | null = null;

// 初始化workInProgress 在这里是hostRootFiber
const prepareFreshStack = (root: FiberRootNode) => {
  workInProgress = createWorkInProgress(root.current, {});
}

const completeUnitOfWork = (fiber: FiberNode) => {
  let node: FiberNode | null = fiber;
  do {
    completeWork(node);
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}

const performUnitOfWork = (fiber: FiberNode) => {
  const next = beginWork(fiber); // next可能为子fiber或者null
  // 返回了next，说明当前fiber已经完成工作，需要给memoizedProps赋值
  fiber.memoizedProps = fiber.pendingProps;

  if (next === null) { // 没有子节点了，执行归阶段
    completeUnitOfWork(fiber);
  } else { // 有子节点，更新workInProgress，继续递阶段
    workInProgress = next;
  }

}

const workLoop = () => {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
  // TODO 调度功能
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root as FiberRootNode)
}

// 找到fiberRootNode
const markUpdateFromFiberToRoot = (fiber: FiberNode): FiberRootNode | null => {
  let node = fiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}


const renderRoot = (root: FiberRootNode) => {
  prepareFreshStack(root);
  // 开始递归
  do {
    try {
      workLoop();
      break;
    } catch (e) {
      if (__DEV__) {
        console.warn('workLoop发生错误', e);
      }
      workInProgress = null;
    }
  } while (true);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  commitRoot(root);
}

const commitRoot = (root: FiberRootNode) => {
  const finishedWork = root.finishedWork;
  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit阶段开始', finishedWork);
  }

  // 重置操作
  root.finishedWork = null;

  // 判断是否存在3个子阶段需要执行的操作
  const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    // 1. beforeMuation
    // 2. muation
    commitMutationEffects(finishedWork);
    root.current = finishedWork;
    // 3. layout

  } else {
    root.current = finishedWork;
  }


}
