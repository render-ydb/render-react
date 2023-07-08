import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ElementType, Key, Props, ReactElementType, Ref, Type } from 'shared/ReactTypes';
const ReactElement = (type: Type, key: Key, ref: Ref, props: Props): ReactElementType => {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'render',
  };
  return element;
}

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  let ref: Ref = null;
  const props: Props = {};
  for (const prop in config) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
    }
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      props[prop] = val;
    }
  }

  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0]
    } else {
      props.children = maybeChildren;
    }
  }
  return ReactElement(type, key, ref, props)
}

export const jsxDev = jsx;