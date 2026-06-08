import { useEffect, useState } from "react";

export function useLocalStorageState<T>(storageKey: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return initialValue;
    try {
      return { ...initialValue, ...JSON.parse(saved) } as T;
    } catch {
      window.localStorage.removeItem(storageKey);
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue] as const;
}
