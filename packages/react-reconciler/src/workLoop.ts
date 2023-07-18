import { FiberNode, FiberRootNode, PendingPassiveEffects, createWorkInProgress } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import { commitHookEffectListCreate, commitHookEffectListDestroy, commitHookEffectListUnmount, commitMutationEffects } from './commitWork';
import { Lane, NoLane, SyncLane, getHighestPriorityLane, markRootFinished, mergeLanes } from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority } from 'scheduler'
import { HookHasEffect, Passive } from './hookEffectTags';


let workInProgress: FiberNode | null = null;
// 当前正在使用的lane
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects: boolean = false;

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

function flushPassiveeffects(pendingPassiveEffects: PendingPassiveEffects) {
  // 原则：本次更新的任何create回调都必须在所有上一次更新的destroy回调执行完后再执行

  // 首先触发所有unmount effect，且对于某个fiber，如果触发了unmount destroy，本次更新不会再触发update create
  pendingPassiveEffects.unmount.forEach((effect) => {
    // 执行useEffect的onmount的回调执行
    commitHookEffectListUnmount(Passive, effect);
  });
  pendingPassiveEffects.unmount = [];

  // 触发所有上次更新的destroy
  pendingPassiveEffects.update.forEach(effect => {
    commitHookEffectListDestroy(Passive | HookHasEffect, effect);
  })

  // 触发所有这次更新的create
  pendingPassiveEffects.update.forEach(effect => {
    commitHookEffectListCreate(Passive | HookHasEffect, effect)
  });
  pendingPassiveEffects.update = [];

  flushSyncCallbacks();
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

  if ( // 需要执行副作用
    (finishedWork.flags & PassiveMask) !== NoFlags ||
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHasPassiveEffects) {
      rootDoesHasPassiveEffects = true;
      // 调度副作用
      scheduleCallback(NormalPriority, () => {
        // 执行副作用
        flushPassiveeffects(root.pendingPassiveEffects);
        // return;
      });
    }
  }

  // 应用根节点的lanes中去掉当前完成的lane
  markRootFinished(root, lane)

  // 判断是否存在3个子阶段需要执行的操作
  const subtreeHasEffect = (finishedWork.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & (MutationMask | PassiveMask)) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    // 1. beforeMuation
    // 2. muation
    commitMutationEffects(finishedWork, root);
    root.current = finishedWork;
    // 3. layout

  } else {
    root.current = finishedWork;
  }

  rootDoesHasPassiveEffects = false;
  ensureRootIsScheduled(root)

}
