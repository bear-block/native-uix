export type StackRoute = {
  /** Unique per route instance; repeated screen names are allowed. */
  key: string;
  name: string;
  params?: object;
};

export type StackRouteInput = {name: string; params?: object};

/** Versioned route history. Component state and scroll offsets are excluded. */
export type StackState = {version: 1; routes: StackRoute[]};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isJSON(value: unknown, ancestors = new Set<object>(), depth = 0): boolean {
  if (depth > 64) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  if (!Array.isArray(value) && !isRecord(value)) return false;
  ancestors.add(value);
  const valid = (Array.isArray(value) ? Array.from(value) : Object.values(value))
    .every(item => isJSON(item, ancestors, depth + 1));
  ancestors.delete(value);
  return valid;
}

/** Reject an entire invalid snapshot; never silently drop a route. */
export function validateStackState(value: unknown, screenNames: readonly string[]): StackState | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.routes) || value.routes.length === 0) return null;
  const keys = new Set<string>();
  const names = new Set(screenNames);
  for (const route of value.routes) {
    if (!isRecord(route) || typeof route.key !== 'string' || !route.key || keys.has(route.key) ||
        typeof route.name !== 'string' || !names.has(route.name) ||
        (route.params !== undefined && (!isRecord(route.params) || !isJSON(route.params)))) return null;
    keys.add(route.key);
  }
  // Detach restored params from the caller and strip unrelated snapshot fields.
  return {version: 1, routes: value.routes.map(route => ({
    key: route.key as string, name: route.name as string,
    ...(route.params === undefined ? {} : {params: JSON.parse(JSON.stringify(route.params)) as object}),
  }))};
}

export function parseStackState(json: string, screenNames: readonly string[]): StackState | null {
  try { return validateStackState(JSON.parse(json), screenNames); } catch { return null; }
}

export type StackLinkSource = {
  /** Subscribe before reading the pending URL. Return a cleanup function. */
  subscribe: (listener: (url: string) => void) => () => void;
  getInitialURL: () => Promise<string | null>;
};

export type StackLinking = {
  /** Optional app-owned native inbox; defaults to React Native Linking. */
  source?: StackLinkSource;
  /** Disable when remounting a Stack in an already running app. Defaults to true. */
  handleInitialURL?: boolean;
  /** Include the scheme and authority separator, e.g. nativeuix://. */
  prefixes: readonly string[];
  /** App-owned path/parameter parsing; null means this URL is unhandled. */
  resolve: (path: string) => readonly StackRouteInput[] | null;
};

/** Match an explicit prefix; never let a lookalike HTTPS host pass. */
export function resolveStackLink(url: string, linking: StackLinking): readonly StackRouteInput[] | null {
  const prefix = linking.prefixes.find(candidate => {
    if (!candidate || !url.startsWith(candidate)) return false;
    const rest = url.slice(candidate.length);
    return candidate.endsWith('/') || !rest || /^[/?#]/.test(rest);
  });
  if (prefix === undefined) return null;
  try {
    const routes = linking.resolve(url.slice(prefix.length).replace(/^\//, ''));
    return routes && routes.length > 0 ? routes : null;
  } catch { return null; }
}
