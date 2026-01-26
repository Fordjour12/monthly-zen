export type ThrottledFn<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  flush: (...args: Parameters<T>) => void;
  cancel: () => void;
};

export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  waitMs: number,
): ThrottledFn<T> {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);
    pendingArgs = args;

    if (remaining <= 0) {
      last = now;
      fn(...args);
      pendingArgs = null;
      return;
    }

    if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        if (pendingArgs) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
      }, remaining);
    }
  };

  throttled.flush = (...args: Parameters<T>) => {
    if (args.length > 0) {
      pendingArgs = args;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pendingArgs) {
      last = Date.now();
      fn(...pendingArgs);
      pendingArgs = null;
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  };

  return throttled;
}
