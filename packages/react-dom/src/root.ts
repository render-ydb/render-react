import { createContainer, updateConintaer } from 'react-reconciler/src/fiberReconciler';
import { Container } from './hostConfig';
import { ReactElementType } from 'shared/ReactTypes';

export function createRoot(container: Container) {
  const root = createContainer(container);
  return {
    render(element: ReactElementType) {
      return updateConintaer(element, root)
    },
  }
}