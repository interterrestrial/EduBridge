export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Throws an ApiError(400) if any value is null/undefined/empty-string.
 * `fields` is a record of fieldName -> value.
 */
export function throwIfMissing(fields: Record<string, unknown>, message = 'Missing required field(s)'): void {
  const missing = Object.entries(fields)
    .filter(([, v]) => v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new ApiError(400, `${message}: ${missing.join(', ')}`);
  }
}
