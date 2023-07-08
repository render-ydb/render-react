import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 例如ReactDom.createRoot方法调用就会使用createContainer函数
export const createContainer = (container: Container) => {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
}
// 例如ReactDom.createRoot(rootElement).render(<App/>)中render方法调用就会使用createContainer函数
export const updateConintaer = (
  element: ReactElementType | null,
  root: FiberRootNode,
) => {
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(element);
  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    update,
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
}