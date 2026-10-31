import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true sau khi hydrate trên trình duyệt, false khi render phía server.
 * Thay cho mẫu useState + useEffect(() => setMounted(true)) gây render 2 lần.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
