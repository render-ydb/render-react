import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionConponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
  tag: WorkTag; // 组件类型
  pendingProps: Props; // 工作之前的props
  key: Key;// 对应reactElement中的key
  stateNode: any; // 组件对应的真实DOM
  type: any; // 组件本身，例如FunctionComponent,则对应这个函数组件本身()=>{}
  ref: Ref;

  return: FiberNode | null; // 指向父fiberNode
  sibling: FiberNode | null; // 指向右边第一个兄弟fiberNode
  child: FiberNode | null; // 指向第一个子fiberNode
  index: 0; // 同级fiberNode序号， 比如<ul>li*3</ul>，则第一个li的index为0，第二个为1，...

  memoizedProps: Props | null; // 工作完成后的props
  memoizedState: any;
  alternate: FiberNode | null; // 用户current fiber和 workInProgress filber替换，相互指向
  flags: Flags; // fibernode 操作标记
  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例属性
    this.tag = tag;
    this.key = key;
    this.stateNode = null;
    this.type = null;

    // 表示filberNode之间的关系
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    this.ref = null;

    // 工作单元属性
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.updateQueue = null;

    this.alternate = null;
    // 副作用
    this.flags = NoFlags;
  }
}

// 整个应用的根节点fiber对象结构
export class FiberRootNode {
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null; // 指向整个递归更新的HostRootFiber
  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props,
): FiberNode => {
  let wip = current.alternate;
  if (wip === null) {
    // mount 首屏渲染
    wip = new FiberNode(current.tag, current.pendingProps, current.key);
    wip.stateNode = current.stateNode;

    wip.alternate = current;
    current.alternate = wip;

  } else { // 更新
    wip.pendingProps = pendingProps;
    wip.flags = NoFlags; // 清除副作用
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;

  return wip;
}

export const createFiberFromElement = (element: ReactElementType): FiberNode => {
  const { type, key, props } = element;
  let fiberTag: WorkTag = FunctionConponent;
  // <div></div> => type为'div'
  if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('为定义的type类型', element)
  }
  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  return fiber
}

