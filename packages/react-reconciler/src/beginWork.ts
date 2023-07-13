import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { FunctionConponent, HostComponent, HostRoot, HostText } from './workTags';
import { mountChildFibers, renconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';

// 创建当前fiber的子fiber，并返回
// 当前还没有处理fiberNode的sibling节点，todo
export const beginWork = (wip: FiberNode): FiberNode | null => {
  switch (wip.tag) {
    case HostRoot: // HostFiberNode
      return updateHostRoot(wip)
    case HostComponent:
      return updateHostComponent(wip)
    case HostText:
      return null
    case FunctionConponent:
      return updateFunctionComponent(wip);
    default:
      if (__DEV__) {
        console.warn('beginWork为实现的类型', wip.tag)
      }
      return null
  }
}

// 1.计算状态的最新值
// 2. 创造子fiberNode
function updateHostRoot(wip: FiberNode) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  // 最新状态
  const { memoizedState } = processUpdateQueue(baseState, pending);
  // 在这里对应 RenderDom.creareRoot(root).render(<APP/>) 中APP对应的reactElement
  // APP是HostRootFiber的子节点
  // 这里的memoizedState就是hostRootFiber对应的子fiber所对应的reactElement
  wip.memoizedState = memoizedState;

  const nextChildren = wip.memoizedState;
  reconcileChildren(wip, nextChildren);

  return wip.child;
}

// 创造子fiberNode
function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function updateFunctionComponent(wip: FiberNode) {
  // 更新完了全局useState的memoizedState和复用之前的dispatch
  // 也就是为什么使用useState的值的数据都发生改变了
  const nextChildren = renderWithHooks(wip);
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

// 关键点还是在这儿呀
function reconcileChildren(wip: FiberNode, children: ReactElementType | null) {
  const current = wip.alternate;

  if (current !== null) {
    // update
    wip.child = renconcileChildFibers(wip, current.child, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }


}