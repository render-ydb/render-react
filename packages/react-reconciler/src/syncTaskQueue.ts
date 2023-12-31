let syncQueue: Array<(...arg: any) => void> | null = null;
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback: (...arg: any) => void) {
  if (syncQueue === null) {
    syncQueue = [callback]
  } else {
    // 目前只需要保存一次就行啦
    // syncQueue = [callback]
    syncQueue.push(callback);
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue) {
    isFlushingSyncQueue = true;
    try {
      syncQueue.forEach(callback => callback())
    } catch (e) {
      if (__DEV__) {
        console.error('flushSyncCallbacks报错', e);

      }
    } finally {
      isFlushingSyncQueue = false;
      syncQueue = null;
    }
  }
}

