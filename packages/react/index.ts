import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import { jsxDEV, jsx, isValidElement as isValidElementFn } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState)
}

// 内部数据共享层
export const __SECRET__INTERNALS__DO_NOT__USE__OR__YOU__WILL_FIRED = {
  currentDispatcher,
}

// TODO 根据开发环境区分使用jsx还是jsxDev
export const createElement = jsxDEV;

export const isValidElement = isValidElementFn

export const version = '0.0.0';
