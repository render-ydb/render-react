import { Action } from 'shared/ReactTypes';

// 定义update对象类型
export interface Update<State> {
  action: Action<State>;
}

// 定义updateQueue对象类型
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

// 创建update对象
export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action,
  }
}

// 创建updateQueue对象
export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null,
    },
  } as UpdateQueue<State>
}

// 往updateQueue中保存update对象对象
export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>,
) => {
  updateQueue.shared.pending = update;
}

// 消费update对象
export const processUpdateQueue = <State>(
  baseState: State, // 初始的状态
  pendingUpdate: Update<State> | null, // 待消费的状态
): { memoizedState: State } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
  }
  if (pendingUpdate !== null) {
    const action = pendingUpdate.action;
    // baseState=1 update (x)=>4x -> memoizedState=4
    if (action instanceof Function) {
      result.memoizedState = action(baseState);
    } else {
      // baseState=1 update 2 -> memoizedState=2
      result.memoizedState = action;
    }
  }

  return result
}
