export type ClientType = 'customer' | 'admin' | 'staff'

export interface TenantScopedParams {
  tenantId: string
}

interface RequestConfig {
  client: ClientType
  endpoint: string
  tenantId: string
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function simulateRequest<T>({
  client,
  endpoint,
  tenantId,
}: RequestConfig): Promise<T> {
  // Simulates network and keeps tenant/client boundary explicit in one place.
  await wait(80)
  console.info(`[api:${client}] ${endpoint} tenant=${tenantId}`)
  return {} as T
}
