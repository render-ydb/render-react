import { FiberNode, FiberRootNode, PendingPassiveEffects, createWorkInProgress } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import { commitHookEffectListCreate, commitHookEffectListDestroy, commitHookEffectListUnmount, commitMutationEffects } from './commitWork';
import { Lane, NoLane, SyncLane, getHighestPriorityLane, lanesToSchedulerPriority, markRootFinished, mergeLanes } from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority, unstable_shouldYield, unstable_cancelCallback } from 'scheduler'
import { HookHasEffect, Passive } from './hookEffectTags';


let workInProgress: FiberNode | null = null;
// 当前正在使用的lane
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects: boolean = false;

type RootExitStatus = number;
const RootInComplete = 1;
const RootCompleted = 2;
// TODO 执行过程中报错


// 初始化workInProgress 在这里是hostRootFiber
const prepareFreshStack = (root: FiberRootNode, lane: Lane) => {
  root.finishedLane = NoLane;
  root.finishedWork = null;
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


function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function workLoopConcurrent() {
  while (workInProgress !== null && !unstable_shouldYield()) {
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
  const existingCallback = root.callbackNode;

  // 没有任务了
  if (updateLane === NoLane) {
    if (existingCallback !== null) {
      unstable_cancelCallback(existingCallback);
    }
    root.callbackNode = null;
    root.callbackPiority = NoLane;
    return;
  }

  const curPriority = updateLane;
  const prevPriority = root.callbackPiority;

  if (curPriority === prevPriority) {
    return;
  }

  if (existingCallback !== null) {
    unstable_cancelCallback(existingCallback);
  }

  let newCallbackNode = null;


  if (updateLane === SyncLane) {
    // 同步优先级
    if (__DEV__) {
      console.log('在微任务中调度，优先级', updateLane);
    }
    // 同步任务队列中增加，performSyncWorkOnRoot函数
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    // 微任务中执行同步任务中保存的performSyncWorkOnRoot函数
    scheduleMicroTask(flushSyncCallbacks);
  } else {
    // 其他优先级 宏任务调度

    const schedulerPriority = lanesToSchedulerPriority(updateLane);
    newCallbackNode = scheduleCallback(schedulerPriority, performConcurrentWorkOnRoot.bind(null, root))

  }
  root.callbackNode = newCallbackNode;
  root.callbackPiority = curPriority;
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


function performConcurrentWorkOnRoot(root: FiberRootNode, didTimeout: boolean): any {

  // 保证useEffect回调执行
  const curCallback = root.callbackNode;
  const didFlushPassiveEffect = flushPassiveeffects(root.pendingPassiveEffects);
  if (didFlushPassiveEffect) {
    if (root.callbackNode !== curCallback) {
      // 回调中出发点了更新，更新优先级比较高
      return null;
    }
  }

  const lane = getHighestPriorityLane(root.pendingLanes);
  const curCallbackNode = root.callbackNode;
  if (lane === NoLane) {
    return;
  }
  const needSync = lane === SyncLane || didTimeout;


  ensureRootIsScheduled(root);

  // render阶段
  const exitStatus = renderRoot(root, lane, !needSync);
  if (exitStatus === RootInComplete) {
    // 中断
    if (root.callbackNode !== curCallbackNode) {
      return null;
    }
    return performConcurrentWorkOnRoot.bind(null, root)
  }

  if (exitStatus === RootCompleted) {
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLane = lane;
    wipRootRenderLane = NoLane;

    commitRoot(root);
  } else if (__DEV__) {
    console.error('还未实现的并发更新结束状态');

  }

}

function performSyncWorkOnRoot(root: FiberRootNode) {
  // 再次获取最高优先级的lane
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane !== SyncLane) {
    // 其他比SyncLane低的优先级 或者 NoLane
    ensureRootIsScheduled(root);
    return;
  }

  const exitStatus = renderRoot(root, nextLane, false);
  if (exitStatus === RootCompleted) {

    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLane = nextLane;
    wipRootRenderLane = NoLane;

    commitRoot(root);
  } else if (__DEV__) {
    console.error('还未实现的同步更新结束状态');

  }


}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
  if (__DEV__) {
    console.log(`开始${shouldTimeSlice ? '并发' : '同步'}更新`, root)
  }

  if (wipRootRenderLane !== lane) {
    // 初始化
    prepareFreshStack(root, lane);
  }

  do {
    try {
      shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
      break;
    } catch (e) {
      if (__DEV__) {
        console.warn('workLoop发生错误', e);
      }
      workInProgress = null;
    }
  } while (true);

  // 中断执行
  if (shouldTimeSlice && workInProgress !== null) {
    return RootInComplete;
  }

  // render阶段执行完
  if (!shouldTimeSlice && workInProgress !== null) {
    if (__DEV__) {
      console.error('render阶段结束时wip不应该不是null');
    }
  }

  // TODO 报错的结果
  return RootCompleted


}

function flushPassiveeffects(pendingPassiveEffects: PendingPassiveEffects) {
  let didFlushPassiveEffect = false;
  // 原则：本次更新的任何create回调都必须在所有上一次更新的destroy回调执行完后再执行

  // 首先触发所有unmount effect，且对于某个fiber，如果触发了unmount destroy，本次更新不会再触发update create
  pendingPassiveEffects.unmount.forEach((effect) => {
    didFlushPassiveEffect = true;
    // 执行useEffect的onmount的回调执行
    commitHookEffectListUnmount(Passive, effect);
  });
  pendingPassiveEffects.unmount = [];

  // 触发所有上次更新的destroy
  pendingPassiveEffects.update.forEach(effect => {
    didFlushPassiveEffect = true;
    commitHookEffectListDestroy(Passive | HookHasEffect, effect);
  })

  // 触发所有这次更新的create
  pendingPassiveEffects.update.forEach(effect => {
    didFlushPassiveEffect = true;
    commitHookEffectListCreate(Passive | HookHasEffect, effect)
  });
  pendingPassiveEffects.update = [];

  flushSyncCallbacks();
  return didFlushPassiveEffect;
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
