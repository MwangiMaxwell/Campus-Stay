const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeInput<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item)) as T;
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const clean: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(source)) {
      if (key.startsWith('$') || key.includes('.') || BLOCKED_KEYS.has(key)) {
        continue;
      }
      clean[key] = sanitizeInput(child);
    }
    return clean as T;
  }

  return value;
}
