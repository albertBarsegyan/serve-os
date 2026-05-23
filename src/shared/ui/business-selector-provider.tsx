import { useRouteContext } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'
import type { ActiveBusinessState } from '#/shared/store/use-active-business.store'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { BusinessSelector } from '#/shared/ui/business-selector.tsx'

export function BusinessSelectorProvider({ children }: Readonly<{ children: ReactNode }>) {
  const authUser = useRouteContext({
    from: '__root__',
    select: (ctx) => ctx.authUser,
  })

  const active = useActiveBusinessStore((s: ActiveBusinessState) => s.active)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!authUser) return
    // If there's no active business, open the selector so the user picks one
    if (!active) setOpen(true)
  }, [active, authUser])

  return (
    <>
      <BusinessSelector isOpen={open} onClose={() => setOpen(false)} />
      {children}
    </>
  )
}

export default BusinessSelectorProvider
