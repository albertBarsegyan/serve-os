import { createFileRoute } from '@tanstack/react-router'
import { getTenantId } from '#/app/tenant/get-tenant-id'
import { getMenuProducts } from '#/entities/product/api/get-menu-products'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'

interface CustomerMenuLoaderData {
  tenantId: string
  products: Awaited<ReturnType<typeof getMenuProducts>>
}

export const Route = createFileRoute('/customer/menu')({
  loader: async (): Promise<CustomerMenuLoaderData> => {
    const tenantId = getTenantId()
    const products = await getMenuProducts(tenantId)

    return {
      tenantId,
      products,
    }
  },
  component: CustomerMenuRoute,
})

function CustomerMenuRoute() {
  const data = Route.useLoaderData()
  return <CustomerMenuPage tenantId={data.tenantId} products={data.products} />
}
