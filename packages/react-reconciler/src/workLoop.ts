import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';
import { Lane, NoLane, SyncLane, getHighestPriorityLane, markRootFinished, mergeLanes } from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';

let workInProgress: FiberNode | null = null;
// 当前正在使用的lane
let wipRootRenderLane: Lane = NoLane;

// 初始化workInProgress 在这里是hostRootFiber
const prepareFreshStack = (root: FiberRootNode, lane: Lane) => {
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = lane;
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
  const next = beginWork(fiber, wipRootRenderLane);
  fiber.memoizedProps = fiber.pendingProps;

  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }

}

const workLoop = () => {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root as FiberRootNode, lane)
  ensureRootIsScheduled(root as FiberRootNode)
}

// schdule阶段的入口
function ensureRootIsScheduled(root: FiberRootNode) {
  // 得到应用根节点中最高优先级的lane
  const updateLane = getHighestPriorityLane(root.pendingLanes);

  if (updateLane === NoLane) {
    return;
  }

  if (updateLane === SyncLane) {
    // 同步优先级
    if (__DEV__) {
      console.log('在微任务中调度，优先级', updateLane);
    }
    // 同步任务队列中增加，performSyncWorkOnRoot函数
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
    // 微任务中执行同步任务中保存的performSyncWorkOnRoot函数
    scheduleMicroTask(flushSyncCallbacks);
  } else {
    // 其他优先级 宏任务调度
  }
}

// 应用根节点lanes集合增加当前lane
function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane)
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


function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  console.log('我后')
  // 再次获取最高优先级的lane
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane !== SyncLane) {
    // 其他比SyncLane低的优先级 或者 NoLane
    ensureRootIsScheduled(root);
    return;
  }

  if (__DEV__) {
    console.warn('render阶段开始');

  }

  prepareFreshStack(root, lane);
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
  root.finishedLane = lane;
  wipRootRenderLane = NoLane;
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

  const lane = root.finishedLane;
  if (__DEV__ && lane === NoLane) {
    console.error('commit阶段finishedLane不应该是NoLane');

  }

  // 重置操作
  root.finishedWork = null;
  root.finishedLane = NoLane;

  // 应用根节点的lanes中去掉当前完成的lane
  markRootFinished(root, lane)

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
