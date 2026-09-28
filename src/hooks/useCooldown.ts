import { useCallback, useEffect, useState } from "react";

/** Countdown in Sekunden, z. B. als Sperre für „E-Mail erneut senden“. */
export function useCooldown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(seconds), []);

  return { remaining, start };
}
