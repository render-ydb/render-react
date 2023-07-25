import { Action, ReactContext } from 'shared/ReactTypes';

export interface Dispatcher {
  useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
  useEffect: <T>(callback: () => void, deps: Array<any> | void) => void;
  useTransition: () => [boolean, (cb: () => void) => void];
  useRef: <T>(initilaVale: T) => { current: T };
  useContext: <T>(context: ReactContext<T>) => T;
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