import { AuditLog } from '@/models';
import { sanitizeInput } from '@/utils/sanitize';

const SECRET_KEYS = new Set(['password', 'passwordHash', 'token', 'tokenHash', 'mpesaPasskey']);

function cleanMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) {
    return undefined;
  }
  const sanitized = sanitizeInput(meta);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (SECRET_KEYS.has(key)) {
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export async function recordAudit(entry: {
  userId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await AuditLog.create({
    user: entry.userId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    ip: entry.ip,
    meta: cleanMeta(entry.meta),
  });
}
