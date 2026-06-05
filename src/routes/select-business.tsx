import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import {
  useBusinessesQuery,
  useBusinessSwitcher,
} from '#/features/business/model/business-hooks.ts'
import logoBg from '#/shared/assets/logo.png'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store.ts'
import { LazyImage } from '#/shared/ui/lazy-image.tsx'

export const Route = createFileRoute('/select-business')({
  component: SelectBusinessRoute,
  beforeLoad: ({ context }) => {
    if (!context.authUser) throw redirect({ to: sharedRoutePathname.SIGN_IN })
    const businessId = useActiveBusinessStore.getState().active?.id

    if (businessId) throw redirect({ to: adminRoutePathname.DASHBOARD })
  },
})

function SelectBusinessRoute() {
  const navigate = useNavigate()
  const { switchBusiness, isLoading: isSwitching } = useBusinessSwitcher({
    navigate: () => navigate({ to: adminRoutePathname.DASHBOARD }),
  })

  const { isLoading, data: businesses } = useBusinessesQuery({ enabled: true })

  return (
    <main className='relative min-h-screen page-wrap overflow-hidden px-4 py-10'>
      {/* Background logo watermark */}
      <LazyImage
        src={logoBg}
        alt=''
        aria-hidden='true'
        className='pointer-events-none select-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-auto w-150 max-w-[80vw] opacity-20 dark:opacity-60 object-contain'
      />

      <div className='relative z-10 w-full max-w-300'>
        <section className='mb-6'>
          <h1 className='text-3xl font-semibold'>Select a business</h1>
          <p className='text-sm text-muted-foreground mt-2'>
            Choose which business workspace you want to operate in.
          </p>
        </section>

        <section>
          {isLoading && <div>Loading businesses…</div>}

          {!isLoading && businesses?.length === 0 && (
            <div className='space-y-4'>
              <p>No businesses found on your account.</p>
              <Button onClick={() => navigate({ to: '/setup' })}>Create a business</Button>
            </div>
          )}

          <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
            {businesses?.map((b) => (
              <Card key={b.id} className='flex flex-col justify-between'>
                <CardHeader>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription className='truncate'>{b.id}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className='ml-auto'
                    disabled={isSwitching}
                    onClick={() => switchBusiness({ id: b.id, name: b.name, currency: b.currency })}
                  >
                    Select
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
