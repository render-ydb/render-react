import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber'
import internal from 'shared/internals';
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

const { currentDispatcher } = internal;

// 当前正在rending的fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前正在处理的Hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null


// Hook的数据结构
interface Hook {
  memoizedState: any;
  updateQueue: unknown;
  next: Hook | null;
}

export const renderWithHooks = (wip: FiberNode) => {

  // 赋值操作
  currentlyRenderingFiber = wip;
  // 重置操作
  wip.memoizedState = null;

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
  return children;
}

// 创建mount阶段时候的Dispatcher
const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
}

// 创建update阶段时候的Dispatcher
const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
}

function updateState<State>(): [State, Dispatch<State>] {
  // 找到当前useState对应的Hook数据
  const hook = updateWorkInProgressHook();

  // 计算新的state的逻辑
  const queue = hook.updateQueue as UpdateQueue<State>;
  const pending = queue.shared.pending;

  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
    hook.memoizedState = memoizedState;
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
  const update = createUpdate(action);

  enqueueUpdate(
    updateQueue,
    update,
  );

  // 触发更新流程
  scheduleUpdateOnFiber(fiber);

}

function mountWorkInProgressHook(): Hook {
  // if (workInProgressHoos)
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null,
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