import {useQueryClient} from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import type {LucideIcon} from 'lucide-react'
import {
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Puzzle,
  Search,
  Settings,
  ShoppingBag,
  Table as TableIcon,
  UserCircle,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
} from 'lucide-react'
import {useState} from 'react'
import {Button} from '#/components/ui/button'
import {Select} from '#/components/ui/select'
import {authUiMessage} from '#/features/auth/lib/constants/ui-messages.ts'
import {authUserQueryOptions} from '#/features/auth/lib/query-options.ts'
import {useLogoutMutation} from '#/features/auth/model/auth-hooks.ts'
import {useBusinessesQuery, useBusinessSwitcher,} from '#/features/business/model/business-hooks.ts'
import {cn} from '#/lib/utils.ts'
import {BusinessFeature, StaffPermission} from '#/shared/lib/permissions/index.ts'
import {usePermissions} from '#/shared/lib/permissions/use-permissions.ts'
import {adminRoutePathname} from '#/shared/libs/constants/route-pathname/admin.ts'
import {showError, showSuccess} from '#/shared/libs/hooks/toast.ts'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import {ErrorBoundary} from '#/shared/ui/error-boundary.tsx'
import {Logo} from '#/shared/ui/logo.tsx'
import {Modal} from '#/shared/ui/modal'

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
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
      onClick={onNavigate}
    >
      <item.icon
        className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
      />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  )
}

function SidebarBusinessSwitcher({ isCollapsed }: Readonly<{ isCollapsed: boolean }>) {
  const activeBusiness = useActiveBusinessStore((s) => s.active)
  const { data: businesses = [], isLoading } = useBusinessesQuery({ enabled: true })
  const { switchBusiness, isLoading: isSwitching } = useBusinessSwitcher({
    navigate: async () => undefined,
  })

  const selectedBusiness = businesses.find((business) => business.id === activeBusiness?.id)

  const handleChange = (businessId: string) => {
    const business = businesses.find((item) => item.id === businessId)

    if (!business) return showError('Selected business not found.')

    switchBusiness({ id: business.id, name: business.name, currency: business.currency })
  }

  return (
    <div className='rounded-2xl  p-4'>
      {!isCollapsed && (
        <p className='mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
          Business
        </p>
      )}

      <div className='space-y-2'>
        <Select
          value={selectedBusiness?.id ?? ''}
          onChange={(event) => handleChange(event.target.value)}
          disabled={isLoading || isSwitching || businesses.length === 0}
          className={cn('h-11 rounded-xl bg-background text-sm', isCollapsed && 'px-2')}
        >
          <option value='' disabled>
            {isLoading ? 'Loading businesses…' : 'Select a business'}
          </option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>

        {!isCollapsed && (
          <div className='px-1 text-xs text-muted-foreground'>
            {selectedBusiness ? (
              <span className='font-medium text-foreground'>
                Currently in {selectedBusiness.name}
              </span>
            ) : (
              'Choose the business context for this session.'
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminLayout() {
  const isCollapsed = false
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { authUser } = useRouteContext({ from: '/_admin' })
  const { isOwner, canSee, hasPermission } = usePermissions()

  const displayName = (() => {
    if (!authUser) return ''
    if (authUser.type === 'owner') {
      return [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email
    }
    return authUser.displayName || authUser.email || ''
  })()

  const menuItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Orders', icon: ShoppingBag, href: '/orders' },
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
  ]

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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()

      await navigate({ to: '/' })
      queryClient.removeQueries({ queryKey: authUserQueryOptions().queryKey })
      showSuccess(authUiMessage.SUCCESS_LOGOUT)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <div className='flex min-h-screen bg-background text-foreground'>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <Button
          className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:static',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className='flex h-20 items-center px-8'>
          <Link
            to='/'
            className='flex items-center gap-3 font-semibold tracking-tight text-foreground'
          >
            <Logo size='md' />
          </Link>
        </div>

        <div className='flex-1 space-y-8 overflow-y-auto px-4 py-6'>
          {isOwner() && <SidebarBusinessSwitcher isCollapsed={isCollapsed} />}

          <div>
            {!isCollapsed && (
              <p className='mb-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                Menu
              </p>
            )}
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
          </div>

          <div>
            {!isCollapsed && (
              <p className='mb-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                Others
              </p>
            )}
            <nav className='space-y-1'>
              {otherItems.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  isActive={location?.pathname === item.href}
                  isCollapsed={isCollapsed}
                  onNavigate={() => setIsMobileOpen(false)}
                />
              ))}
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
      </aside>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-20 items-center justify-between bg-white px-8'>
          <div className='flex flex-1 items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              className='lg:hidden'
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className='h-5 w-5' />
            </Button>
            <div className='relative w-full max-w-xl'>
              <Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search'
                className='h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              />
            </div>
          </div>

          <div className='flex items-center gap-6'>
            <Link
              to='/user-settings'
              className='flex h-12 gap-4 cursor-pointer items-center rounded-xl border px-3 hover:bg-accent'
            >
              <div className='h-9 w-9 flex items-center justify-center overflow-hidden rounded-xl bg-muted'>
                <span>{displayName[0]}</span>
              </div>
              <div className='hidden flex-row items-center gap-2 sm:flex'>
                <span className='text-sm font-bold'>{displayName}</span>
              </div>
            </Link>

            {/*<Button variant='ghost' size='icon' className='relative h-11 w-11 rounded-xl bg-muted'>*/}
            {/*  <Bell className='h-5 w-5 text-muted-foreground' />*/}
            {/*  <span className='absolute right-3.5 top-3.5 flex h-2 w-2 rounded-full border-2 border-white bg-red-500' />*/}
            {/*</Button>*/}
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-8 scrollbar-hide'>
          <Outlet />
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
