import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChefHat,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  Puzzle,
  Settings,
  ShoppingBag,
  Table as TableIcon,
  UserCircle,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ThemeSwitcher } from '#/components/theme-switcher.tsx'
import { Button } from '#/components/ui/button'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import { useLogoutMutation } from '#/features/auth/model/auth-hooks.ts'
import {
  useBusinessesQuery,
  useBusinessSwitcher,
} from '#/features/business/model/business-hooks.ts'
import { PaletteSwitcher } from '#/features/palette/ui/PaletteSwitcher.tsx'
import { useLogoutStaffMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils.ts'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import {
  useActiveBusiness,
  useSelectedBusinessId,
} from '#/shared/libs/hooks/use-active-business.ts'
import { BusinessFeature, StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary.tsx'
import { Logo } from '#/shared/ui/logo.tsx'
import { Modal } from '#/shared/ui/modal'

function AdminErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <header className='flex h-20 items-center border-b border-border bg-card px-8'>
        <Logo size='sm' />
      </header>
      <main className='flex-1 overflow-y-auto p-8'>
        <ErrorBoundary error={error} />
      </main>
    </div>
  )
}

export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
  errorComponent: AdminErrorComponent,
  beforeLoad: ({ context, location }) => {
    if (!context.authUser) throw redirect({ to: '/auth/sign-in' })
    if (
      context.authUser.type === 'owner' &&
      !context.authUser.hasBusiness &&
      location.pathname !== adminRoutePathname.SETUP_BUSINESS
    ) {
      throw redirect({ to: adminRoutePathname.SETUP_BUSINESS })
    }
  },
})

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

function SidebarNavSkeleton({
  count,
  isCollapsed,
}: Readonly<{ count: number; isCollapsed: boolean }>) {
  const widths = ['w-20', 'w-16', 'w-24', 'w-14', 'w-20', 'w-16', 'w-12']
  return (
    <div className='space-y-1'>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${
            // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
            i
          }`}
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3',
            isCollapsed && 'justify-center',
          )}
        >
          <div className='h-5 w-5 shrink-0 rounded-md bg-muted animate-pulse' />
          {!isCollapsed && (
            <div
              className={cn('h-4 rounded-md bg-muted animate-pulse', widths[i % widths.length])}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function SidebarNavLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: Readonly<{
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onNavigate: () => void
}>) {
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
        {
          'bg-accent text-accent-foreground': isActive,
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground': !isActive,
          'justify-center': isCollapsed,
        },
      )}
      onClick={onNavigate}
    >
      <item.icon
        className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
      />
      {!isCollapsed && <span className='whitespace-nowrap'>{item.label}</span>}
    </Link>
  )
}

function BusinessSwitcher() {
  const selectedBusinessId = useSelectedBusinessId()
  const { data: businesses = [], isLoading } = useBusinessesQuery({ enabled: true })
  const { switchBusiness, isLoading: isSwitching } = useBusinessSwitcher({
    navigate: async () => undefined,
  })
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId)

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setIsOpen((o) => !o)}
        disabled={isLoading || isSwitching}
        className='cursor-pointer flex items-center gap-2 h-12 px-3 rounded-xl border border-input bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50'
      >
        {selectedBusiness?.logoUrl ? (
          <img
            src={selectedBusiness.logoUrl}
            alt={selectedBusiness.name}
            className='h-5 w-5 shrink-0 rounded object-cover'
          />
        ) : (
          <Building2 className='h-4 w-4 shrink-0 text-muted-foreground' />
        )}
        <span className='hidden sm:block max-w-35 truncate text-foreground'>
          {isLoading ? 'Loading…' : (selectedBusiness?.name ?? 'Select business')}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden'>
          <div className='px-3 pt-3 pb-1'>
            <p className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
              Switch business
            </p>
          </div>
          <div className='p-2 space-y-0.5'>
            {businesses.map((business) => {
              const isActive = business.id === selectedBusinessId
              return (
                <button
                  key={business.id}
                  type='button'
                  onClick={() => {
                    switchBusiness(business.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors text-left',
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <div className='flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-bold uppercase'>
                    {business.logoUrl ? (
                      <img
                        src={business.logoUrl}
                        alt={business.name}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      business.name[0]
                    )}
                  </div>
                  <span className='flex-1 truncate'>{business.name}</span>
                  {isActive && <Check className='h-4 w-4 shrink-0 text-primary' />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const location = useLocation()
  const navigation = useNavigate()

  const queryClient = useQueryClient()
  const { authUser } = useRouteContext({ from: '/_admin' })
  const { isOwner, canSee, hasPermission } = usePermissions()
  const activeBusiness = useActiveBusiness()
  const { isLoading: isBusinessLoading } = useBusinessesQuery({
    enabled: authUser?.type === 'owner',
  })
  const isSidebarLoading = authUser?.type === 'owner' ? isBusinessLoading : false

  const displayName = (() => {
    if (!authUser) return ''
    if (authUser.type === 'owner') {
      return [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email
    }
    return authUser.displayName || authUser.email || ''
  })()

  const menuItems: NavItem[] = useMemo(
    () => [
      ...(isOwner() || hasPermission(StaffPermission.ORDER_VIEW)
        ? [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }]
        : []),
      ...(isOwner() ||
      (hasPermission(StaffPermission.ORDER_VIEW) && !hasPermission(StaffPermission.KITCHEN_VIEW))
        ? [{ label: 'Orders', icon: ShoppingBag, href: '/orders' }]
        : []),
      ...(canSee(BusinessFeature.TABLES) && (isOwner() || hasPermission(StaffPermission.TABLE_VIEW))
        ? [{ label: 'Tables', icon: TableIcon, href: '/tables' }]
        : []),
      ...(isOwner() || hasPermission(StaffPermission.MENU_VIEW)
        ? [{ label: 'Menu', icon: UtensilsCrossed, href: '/menu' }]
        : []),
      ...(isOwner() || hasPermission(StaffPermission.MENU_EDIT)
        ? [{ label: 'Modifiers', icon: Puzzle, href: '/modifiers' }]
        : []),
      ...(canSee(BusinessFeature.KDS) && (isOwner() || hasPermission(StaffPermission.KITCHEN_VIEW))
        ? [{ label: 'Service (KDS)', icon: ChefHat, href: '/kitchen' }]
        : []),
      ...(isOwner() ? [{ label: 'Businesses', icon: Warehouse, href: '/businesses' }] : []),
    ],
    [canSee, hasPermission, isOwner],
  )

  const otherItems: NavItem[] = [
    ...(isOwner() || hasPermission(StaffPermission.STAFF_MANAGE)
      ? [{ label: 'Staff', icon: Users, href: '/staff' }]
      : []),
    ...(isOwner() ||
    hasPermission(StaffPermission.PAYMENT_TAKE) ||
    hasPermission(StaffPermission.REPORTS_VIEW)
      ? [{ label: 'Payments', icon: CreditCard, href: '/payments' }]
      : []),
    ...(isOwner() ? [{ label: 'Payment Methods', icon: Wallet, href: '/payment-methods' }] : []),
    ...(isOwner() || hasPermission(StaffPermission.BUSINESS_SETTINGS)
      ? [{ label: 'Settings', icon: Settings, href: '/settings' }]
      : []),
    ...(isOwner() ? [{ label: 'Account', icon: UserCircle, href: '/user-settings' }] : []),
  ]

  const logoutMutation = useLogoutMutation()
  const logoutStaffMutation = useLogoutStaffMutation()

  const handleLogout = async () => {
    try {
      if (authUser?.type === 'staff') {
        const businessId = authUser.businessId
        const slug = activeBusiness?.slug
        await logoutStaffMutation.mutateAsync(businessId)
        await queryClient.cancelQueries()
        queryClient.clear()
        showSuccess(authUiMessage.SUCCESS_LOGOUT)
        await navigation({ to: slug ? `/b/${slug}/staff-login` : '/auth/sign-in' })
      } else {
        await logoutMutation.mutateAsync()
        showSuccess(authUiMessage.SUCCESS_LOGOUT)
        await navigation({ to: '/auth/sign-in' })
      }
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  useBodyScrollLock(isMobileOpen)

  return (
    <div className='flex min-h-screen bg-background text-foreground'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 flex flex-col border-r border-border bg-card transition-all duration-300 lg:static',
          isMobileOpen ? 'translate-x-0 w-full z-30' : '-translate-x-full w-full z-30',
          isCollapsed ? 'lg:translate-x-0 lg:w-20' : 'lg:translate-x-0 lg:w-72',
        )}
      >
        <div
          className={cn('flex h-20 items-center justify-between pr-4', {
            'pl-4': isCollapsed,
            'pl-8': !isCollapsed,
          })}
        >
          <Link
            to='/'
            onClick={() => {
              isMobileOpen && setIsMobileOpen(false)
            }}
            className='flex items-center gap-3 font-semibold tracking-tight text-foreground'
          >
            <Logo size='md' showText={!isCollapsed} />
          </Link>
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden'
            onClick={() => setIsMobileOpen(false)}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
        </div>

        <div className='flex-1 space-y-8 overflow-y-auto px-4 py-6'>
          <div>
            {!isCollapsed &&
              (isSidebarLoading ? (
                <div className='mb-4 px-4 h-2.5 w-10 rounded bg-muted animate-pulse' />
              ) : (
                <p className='mb-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Menu
                </p>
              ))}
            {isSidebarLoading ? (
              <SidebarNavSkeleton count={5} isCollapsed={isCollapsed} />
            ) : (
              <nav className='space-y-1'>
                {menuItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    isActive={location?.pathname === item.href}
                    isCollapsed={isCollapsed}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                ))}
              </nav>
            )}
          </div>

          <div>
            {!isCollapsed &&
              (isSidebarLoading ? (
                <div className='mb-4 px-4 h-2.5 w-12 rounded bg-muted animate-pulse' />
              ) : (
                <p className='mb-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                  Others
                </p>
              ))}
            <nav className='space-y-1'>
              {isSidebarLoading ? (
                <SidebarNavSkeleton count={3} isCollapsed={isCollapsed} />
              ) : (
                otherItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    isActive={location?.pathname === item.href}
                    isCollapsed={isCollapsed}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                ))
              )}
              <Button
                type='button'
                variant='ghost'
                className={cn(
                  'w-full justify-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  isCollapsed && 'justify-center px-0',
                )}
                onClick={() => setIsLogoutOpen(true)}
              >
                <LogOut className='h-5 w-5' />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </nav>
          </div>
        </div>

        <Button
          variant='outline'
          className='hidden lg:flex absolute top-1/2 right-0 translate-x-4 px-1 py-1 rounded-sm bg-card shadow-lg'
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? <ArrowRight className='h-5 w-5' /> : <ArrowLeft className='h-5 w-5' />}
        </Button>
      </aside>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-20 items-center justify-between bg-card px-8'>
          <div className='flex flex-1 items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              className='lg:hidden'
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className='h-5 w-5' />
            </Button>
          </div>

          <div className='flex items-center gap-3'>
            <PaletteSwitcher />
            <ThemeSwitcher />
            {isOwner() && <BusinessSwitcher />}

            <Link
              to='/user-settings'
              className='flex h-12 gap-4 cursor-pointer items-center rounded-xl border px-3 hover:bg-accent'
            >
              <div className='h-9 w-9 flex items-center justify-center overflow-hidden rounded-xl bg-muted'>
                {authUser?.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={displayName}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <span>{displayName[0]}</span>
                )}
              </div>
              <div className='hidden flex-row items-center gap-2 sm:flex'>
                <span className='text-sm font-bold'>{displayName}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-8 scrollbar-hide'>
          <div key={location.pathname} className='page-enter'>
            <Outlet />
          </div>
        </main>
      </div>
      <Modal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title='Confirm logout'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsLogoutOpen(false)}>
              No
            </Button>
            <Button
              onClick={() => {
                setIsLogoutOpen(false)
                void handleLogout()
              }}
            >
              Yes
            </Button>
          </>
        }
      >
        <p>Do you really want to logout?</p>
      </Modal>
    </div>
  )
}
