import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

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
  alternate: FiberNode|null; // 用户current fiber和 workInProgress filber替换，相互指向
  flags: Flags; // fibernode 操作标记 （）

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
    this.alternate = null;
    // 副作用
    this.flags = NoFlags;
  }
}