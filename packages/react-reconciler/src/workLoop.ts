import { FiberNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';

let workInProgress: FiberNode | null = null;


const prepareFreshStack = (fiber: FiberNode) => {
  workInProgress = fiber;
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

const renderRoot = (root: FiberNode) => {
  // 初始化当前fiber
  prepareFreshStack(root);
  // 开始递归
  do {
    try {
      workLoop();
      break;
    } catch (e) {
      console.warn('workLoop发生错误', e);
      workInProgress = null;
    }
  } while (true);
}
