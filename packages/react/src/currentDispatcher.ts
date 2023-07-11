import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
  useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
}

export type Dispatch<State> = (action: Action<State>) => void;

// 当前使用的hooks合集
const currentDispatcher: { current: Dispatcher | null } = {
  current: null,
}

export const resolveDispatcher = (): Dispatcher => {
  const dispatcher = currentDispatcher.current;
  if (dispatcher === null) {
    throw new Error('Hooks只能在函数组件中执行')
  }
  return dispatcher;
}


export default currentDispatcher;