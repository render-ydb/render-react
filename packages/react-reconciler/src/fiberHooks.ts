import { FiberNode } from './fiber'
import internal from 'shared/internals';

const { currentDispatcher } = internal;

// 当前正在rending的fiber
let currentlyRenderingFiber: FiberNode | null = null;

// 当前正在处理的Hook
let workInProgressHoos: Hook | null = null;


// Hook的数据结构
interface Hook {
  memoizedState: any;
  updateQueue: unknown;
  next: Hook | null;
}

export const renderWithHooks = (wip: FiberNode) => {

  // 赋值操作
  currentlyRenderingFiber = wip;
  wip.memoizedState = null;

  const current = wip.alternate;
  if (current !== null) {
    // update
  } else {
    // mount
    // current.dispatcher
    // currentDispatcher.current =
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置操作
  currentlyRenderingFiber = null;
  return children;
}