import '@testing-library/jest-dom/vitest';

installWebStorageFallback('localStorage');
installWebStorageFallback('sessionStorage');

/**
 * Node >= 24 ships a built-in Web Storage global. Because it is already an own
 * property of `globalThis`, the jsdom test environment does not override it, and
 * the built-in implementation is inert unless Node is started with
 * `--localstorage-file`. That makes `localStorage.getItem` unavailable inside
 * tests. When the global storage is not usable, replace it with a minimal
 * in-memory implementation so browser code under test behaves as it does in a
 * real browser.
 */
function installWebStorageFallback(key: 'localStorage' | 'sessionStorage'): void {
  const current = (globalThis as Record<string, unknown>)[key] as Storage | undefined;

  if (current && typeof current.getItem === 'function') {
    return;
  }

  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: createMemoryStorage(),
  });
}

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (name: string) => entries.get(String(name)) ?? null,
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    removeItem: (name: string) => {
      entries.delete(String(name));
    },
    setItem: (name: string, value: string) => {
      entries.set(String(name), String(value));
    },
  };
}
