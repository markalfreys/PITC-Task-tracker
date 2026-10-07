type GlobalWithRegistry = typeof globalThis & {
  __appSingletons?: Map<string, unknown>;
};

// Next.js may load a module more than once, so shared state is kept on globalThis.
export function globalSingleton<T>(key: string, create: () => T): T {
  const registry = ((globalThis as GlobalWithRegistry).__appSingletons ??= new Map());
  if (!registry.has(key)) registry.set(key, create());
  return registry.get(key) as T;
}
