export function throttle<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
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
}
