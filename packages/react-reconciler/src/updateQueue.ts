import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane, NoLane, isSubsetOflanes } from './fiberLanes';

// 定义update对象类型
export interface Update<State> {
  action: Action<State>;
  next: Action<any> | null;
  lane: Lane;
}

// 定义updateQueue对象类型
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
  dispatch: Dispatch<State> | null;
}

// 创建update对象
export const createUpdate = <State>(action: Action<State>, lane: Lane): Update<State> => {
  return {
    action,
    next: null,
    lane,
  }
}

// 创建updateQueue对象
export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null,
    },
    dispatch: null,
  } as UpdateQueue<State>
}

// 往updateQueue中保存update对象对象
// 形成环状链表，链表第一个元素指向最后一个update，最后一个update的next指向第一个update
// pending = a->a pending b->a->b pending c-a-b-c
export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>,
) => {
  const pending = updateQueue.shared.pending;
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  updateQueue.shared.pending = update;

}

// 消费update对象
export const processUpdateQueue = <State>(
  baseState: State, // 初始的状态
  pendingUpdate: Update<State> | null, // 待消费的状态
  renderLane: Lane,
): {
    memoizedState: State;
    baseState: State;
    baseQueue: Update<State> | null;
  } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
    baseState,
    baseQueue: null,
  }
  if (pendingUpdate !== null) {
    // 第一个update
    const first = pendingUpdate.next;
    let pending = pendingUpdate.next;

    let newBaseState = baseState; // baseState的最新值
    let newBaseQueueFirst: Update<State> | null = null;
    let newBaseQueueLast: Update<State> | null = null;
    let newState = baseState; // 一次计算的结果

    do {
      const updateLane = pending.lane;
      if (!isSubsetOflanes(renderLane, updateLane)) {
        // 优先级不够 被跳过
        const clone = createUpdate(pending.action, pending.lane);

        // 是不是第一个被跳过的update
        if (newBaseQueueFirst === null) {
          newBaseQueueFirst = clone;
          newBaseQueueLast = clone;
          newBaseState = newState; // 考虑优先级的情况下，newBaseState的值会被固定下来
        } else {
          (newBaseQueueLast as Update<State>).next = clone;
          newBaseQueueLast = clone;
        }

      } else {
        if (newBaseQueueLast !== null) {
          const clone = createUpdate(pending.action, NoLane);
          (newBaseQueueLast as Update<State>).next = clone;
          newBaseQueueLast = clone;
        }


        const action = pending.action;
        // baseState=1 update (x)=>4x -> memoizedState=4
        if (action instanceof Function) {
          newState = action(baseState);
        } else {
          // baseState=1 update 2 -> memoizedState=2
          newState = action;
        }

      }
      pending = pending.next;
    } while (pending !== first);

    if (newBaseQueueLast === null) {
      // 本次计算没有update被跳过
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }
    result.memoizedState = newState;
    result.baseState = newBaseState;
    result.baseQueue = newBaseQueueLast;
  }

  return result
}
