import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import { jsxDEV } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState)=>{
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState)
}

/// 内部数据共享层
export const __SECRET__INTERNALS__DO_NOT__USE__OR__YOU__WILL_FIRED = {
  currentDispatcher,
}

export default {
  version: '0.0.0',
  createElement: jsxDEV,
}