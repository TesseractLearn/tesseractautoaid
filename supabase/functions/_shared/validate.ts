// Lightweight input validation helpers for edge functions

export function isUUID(val: unknown): val is string {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

export function isPositiveNumber(val: unknown, max = 1000000): val is number {
  return typeof val === 'number' && val > 0 && val <= max && Number.isFinite(val)
}

export function isString(val: unknown, maxLength = 2000): val is string {
  return typeof val === 'string' && val.length > 0 && val.length <= maxLength
}

export function isOptionalString(val: unknown, maxLength = 2000): val is string | undefined {
  return val === undefined || val === null || (typeof val === 'string' && val.length <= maxLength)
}

export function isStringArray(val: unknown, maxItems = 20, maxItemLength = 500): val is string[] {
  return Array.isArray(val) && val.length <= maxItems && val.every(v => typeof v === 'string' && v.length <= maxItemLength)
}

export function isUUIDArray(val: unknown, maxItems = 50): val is string[] {
  return Array.isArray(val) && val.length <= maxItems && val.every(v => isUUID(v))
}

export function isOptionalPositiveNumber(val: unknown, min = 1, max = 1000000): val is number | undefined {
  return val === undefined || val === null || (typeof val === 'number' && val >= min && val <= max && Number.isFinite(val))
}

export function validationError(message: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
