import { FiberNode } from './fiber';
import { NoFlags, Update } from './fiberFlags';
import { FunctionConponent, HostComponent, HostRoot, HostText } from './workTags';
import { Container, appendInitialChild, createInstance, createTextInstance } from 'hostConfig';

function markUpdate(fiber: FiberNode) {
  fiber.flags |= Update;
}

// 递归中的归阶段
// 对于Host类型fiberNode：构建离屏DOM树
// 标记Update flag（TODO）
export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps;
  const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:

      if (current !== null && wip.stateNode) {
        // update

      } else { // mount阶段
        // 1. 构建DOM树
        const instance = createInstance(wip.type, newProps)
        // 2. 将DOM插入到DOM树中
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode) {
        // update
        const oldText = current.memoizedProps.content;
        const nexText = newProps.content;
        if (oldText !== nexText) {
          markUpdate(wip);
        }

      } else { // mount阶段
        // 1. 构建DOM树
        const instance = createTextInstance(newProps.content)
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
      bubbleProperties(wip);
      return null;
    case FunctionConponent:
      bubbleProperties(wip);
      return null;

    default:
      if (__DEV__) {
        console.warn('未处理的completeWork情况', wip);
      }
      return null
  }
}
// wip插入到parent，还需要插入wip的其他sibling
// function A(){retrun <div></div>}插入的应该是div
function appendAllChildren(parent: Container, wip: FiberNode) {
  let node = wip.child;

  while (node !== null) {
    if (node?.tag === HostComponent || node?.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === wip) {
      return;
    }

    // wip的sibling插入的情况
    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        // 死循环？ 这里的return有问题，会死循环 在考虑一下
        return;
      }
      node = node?.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;

  }

}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;


  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }
  // 得到wip下所有子节点的subtreeFlags和flags
  wip.subtreeFlags |= subtreeFlags;

}