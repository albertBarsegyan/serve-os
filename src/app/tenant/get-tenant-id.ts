interface TenantOptions {
  fallback?: string
}

export function getTenantId(options?: TenantOptions): string {
  // In production this could resolve from host, auth claims, or session.
  return options?.fallback ?? 'tenant-alpha'
}
