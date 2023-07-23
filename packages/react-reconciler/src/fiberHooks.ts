import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber'
import internal from 'shared/internals';
import { Update, UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, NoLane, requestUpdateLanes } from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

const { currentDispatcher } = internal;

// 当前正在rending的fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前正在处理的Hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;


// Hook的数据结构
interface Hook {
  memoizedState: any;
  updateQueue: unknown;
  next: Hook | null;
  baseState: any;
  baseQueue: Update<any> | null;
}

type EffectCallback = () => void;
type EffectDeps = Array<any> | null;

export interface Effect {
  tags: Flags;
  create: EffectCallback | void;
  destroy: EffectCallback | void;
  deps: EffectDeps;
  next: Effect | null;
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
  lastEffect: Effect | null;
}


export const renderWithHooks = (wip: FiberNode, lane: Lane) => {

  // 赋值操作
  currentlyRenderingFiber = wip;
  // 重置hooks链表操作
  wip.memoizedState = null;
  // 重置effect链表操作
  wip.updateQueue = null;
  renderLane = lane;

  const current = wip.alternate;
  if (current !== null) {
    // update
    currentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // mount
    // current.dispatcher
    currentDispatcher.current = HooksDispatcherOnMount;
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置操作
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderLane = NoLane;
  return children;
}

// 创建mount阶段时候的Dispatcher
const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
  // @ts-ignore
  useEffect: mountEffect,
}

// 创建update阶段时候的Dispatcher
const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  // @ts-ignore
  useEffect: updateEffect,
}

function updateState<State>(): [State, Dispatch<State>] {
  // 找到当前useState对应的Hook数据
  const hook = updateWorkInProgressHook();

  // 计算新的state的逻辑
  const queue = hook.updateQueue as UpdateQueue<State>;
  const baseState = hook.baseState;

  const pending = queue.shared.pending;

  queue.shared.pending = null;
  const current = currentHook as Hook;
  let baseQueue = current.baseQueue;


  if (pending !== null) {
    // pending baseQueue update保存在current中
    if (baseQueue !== null) {
      // baseQueue b2->b0->b1->b2
      // pendingQueue p2->p0->p1->p2

      // b0
      const baseFirst = baseQueue.next;
      // p0
      const pendingFirst = pending.next;
      // b2->p0
      baseQueue.next = pendingFirst;
      // p2->b0
      pending.next = baseFirst;
      // p2->b0->b1->b2->>p0->p1->p2
    }
    baseQueue = pending;
    // 保存在current中
    current.baseQueue = pending;
    queue.shared.pending = null;

    if (baseQueue !== null) {
      const { memoizedState, baseQueue: newBaseQueu, baseState: newBaseState } = processUpdateQueue(baseState, baseQueue, renderLane);
      hook.memoizedState = memoizedState;
      hook.baseQueue = newBaseQueu;
      hook.baseState = newBaseState;
    }
  }

  return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgressHook(): Hook {
  // TODO render阶段出发的更新，比如直接调用setNum
  let nextCurrentHook: Hook | null;
  if (currentHook === null) {
    // update时候的第一个HOOK
    const current = currentlyRenderingFiber?.alternate;
    if (current !== null) {
      nextCurrentHook = current?.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // update后续的Hook
    nextCurrentHook = currentHook.next;
  }

  if (nextCurrentHook === null) {
    throw new Error(
      `组件${currentlyRenderingFiber?.type}本次执行的HOOK比上次执行的多`,
    );
  }

  currentHook = nextCurrentHook;
  const newHook: Hook = {
    memoizedState: currentHook?.memoizedState,
    updateQueue: currentHook?.updateQueue,
    next: null,
    baseQueue: currentHook.baseQueue,
    baseState: currentHook.baseState,
  }

  if (workInProgressHook === null) {
    // mount时候，第一次使用useState
    if (currentlyRenderingFiber === null) { // 说明没有在函数组件中使用useState
      throw new Error('Hooks只能在函数组件中执行')
    } else {
      workInProgressHook = newHook;
      currentlyRenderingFiber.memoizedState = workInProgressHook; // 指向当前函数组件中hooks列表的第一个
    }
  } else {
    // mounts时候 不是第一次使用hooks
    workInProgressHook.next = newHook;
    workInProgressHook = newHook; // 指向下一个hook
  }
  return workInProgressHook;


}

function mountEffect(create: EffectCallback | void, deps: EffectDeps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
  hook.memoizedState = pushEffect(
    Passive | HookHasEffect,
    create,
    undefined,
    nextDeps,
  );
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy: EffectCallback | void;
  if (currentHook !== null) {
    const preEffect = currentHook.memoizedState as Effect;
    destroy = preEffect.destroy;
    if (nextDeps !== null) {
      // 浅比较依赖
      const prevDeps = preEffect.deps;
      // 依赖相同
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(Passive, create, destroy, deps);
        return;
      }

    }
    // 依赖不相等
    (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
    hook.memoizedState = pushEffect(Passive | HookHasEffect, create, destroy, deps);
  }
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
  if (prevDeps === null || nextDeps === null) {
    return false
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(prevDeps[i], nextDeps[i])) {
      continue;
    } else {
      return false
    }
  }
  return true;
}

function pushEffect(
  hookFlags: Flags,
  create: EffectCallback | void,
  destroy: EffectCallback | void,
  deps: EffectDeps,
): Effect {
  const effect: Effect = {
    tags: hookFlags,
    create,
    destroy,
    deps,
    next: null,
  }
  const fiber = currentlyRenderingFiber as FiberNode;
  let updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
  if (updateQueue === null) {
    updateQueue = createFCUpdateQuque();
    fiber.updateQueue = updateQueue;
    effect.next = effect;
    updateQueue.lastEffect = effect;
  } else {
    // 插入effect
    const laseEffect = updateQueue.lastEffect;
    if (laseEffect === null) {
      effect.next = effect;
      updateQueue.lastEffect = effect;
    } else {
      const firstEffect = laseEffect.next;
      laseEffect.next = effect;
      effect.next = firstEffect;
      updateQueue.lastEffect = effect;
    }
  }
  return effect;
}

function createFCUpdateQuque<State>() {
  const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
  updateQueue.lastEffect = null;
  return updateQueue;
}

function mountState<State>(
  initialState: State | (() => State),
): [State, Dispatch<State>] {
  // 找到当前useState对应的Hook数据
  const hook = mountWorkInProgressHook();

  let memoizedState;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }

  const queue = createUpdateQueue<State>();
  hook.updateQueue = queue;
  hook.memoizedState = memoizedState;

  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  queue.dispatch = dispatch;
  return [memoizedState, dispatch];
}

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>,
) {
  const lane = requestUpdateLanes();
  const update = createUpdate(action, lane);
  enqueueUpdate(
    updateQueue,
    update,
  );

  // 触发更新流程
  scheduleUpdateOnFiber(fiber, lane);

}

function mountWorkInProgressHook(): Hook {
  // if (workInProgressHoos)
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null,
    baseQueue: null,
    baseState: null,
  }
  if (workInProgressHook === null) {
    // mount时候，第一次使用useState
    if (currentlyRenderingFiber === null) { // 说明没有在函数组件中使用useState
      throw new Error('Hooks只能在函数组件中执行')
    } else {
      workInProgressHook = hook;
      currentlyRenderingFiber.memoizedState = workInProgressHook; // 指向当前函数组件中hooks列表的第一个
    }
  } else {
    // mounts时候 不是第一次使用hooks
    workInProgressHook.next = hook;
    workInProgressHook = hook; // 指向下一个hook
  }
  return workInProgressHook;
}