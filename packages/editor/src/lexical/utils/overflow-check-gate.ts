export type OverflowCheckCause = 'paste' | 'content';

export interface OverflowCheckRequest<T> {
  target: T;
  cause: OverflowCheckCause;
}

interface FrameScheduler {
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
}

const browserFrameScheduler: FrameScheduler = {
  request: callback => requestAnimationFrame(callback),
  cancel: handle => cancelAnimationFrame(handle),
};

/**
 * Serializes overflow extraction without losing layout checks that arrive while
 * the current split is being delivered to the next page.
 */
export function createOverflowCheckGate<T>(
  scheduler: FrameScheduler = browserFrameScheduler,
) {
  let processing = false;
  let pending: OverflowCheckRequest<T> | null = null;
  let pendingFrame: number | null = null;
  let disposed = false;

  const deferIfProcessing = (request: OverflowCheckRequest<T>): boolean => {
    if (!processing) {
      return false;
    }

    pending = {
      target: request.target,
      cause:
        pending?.cause === 'paste' || request.cause === 'paste'
          ? 'paste'
          : 'content',
    };
    return true;
  };

  const start = (): boolean => {
    if (disposed || processing) {
      return false;
    }

    processing = true;
    return true;
  };

  const finish = (replay: (request: OverflowCheckRequest<T>) => void): void => {
    if (!processing) {
      return;
    }

    processing = false;
    if (disposed || !pending) {
      return;
    }

    const request = pending;
    pending = null;
    pendingFrame = scheduler.request(() => {
      pendingFrame = null;
      if (!disposed) {
        replay(request);
      }
    });
  };

  const dispose = (): void => {
    disposed = true;
    processing = false;
    pending = null;
    if (pendingFrame !== null) {
      scheduler.cancel(pendingFrame);
      pendingFrame = null;
    }
  };

  return {
    deferIfProcessing,
    dispose,
    finish,
    start,
  };
}
