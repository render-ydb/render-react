import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import { jsxDEV, jsx, isValidElement as isValidElementFn } from './src/jsx'
import currentBatchConfig from './src/currentBatchConfig';

export const useState: Dispatcher['useState'] = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState)
}

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps)
}


export const useTransition: Dispatcher['useTransition'] = () => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition()
}


export const useRef: Dispatcher['useRef'] = (initilaVale) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initilaVale)
}
// 内部数据共享层
export const __SECRET__INTERNALS__DO_NOT__USE__OR__YOU__WILL_FIRED = {
  currentDispatcher,
  currentBatchConfig,
}

// TODO 根据开发环境区分使用jsx还是jsxDev
export const createElement = jsxDEV;

export const isValidElement = isValidElementFn

export const version = '0.0.0';
