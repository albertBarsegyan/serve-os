import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import {
  Bell,
  ChefHat,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Table as TableIcon,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { useState } from 'react'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { useLogoutMutation } from '#/features/auth/model/auth-hooks.ts'
import { cn } from '#/lib/utils.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary.tsx'
import { Modal } from '#/shared/ui/Modal'
import { Button } from '#/components/ui/button'

function AdminErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <header className='flex h-20 items-center border-b border-border bg-card px-8'>
        <h1 className='text-lg font-semibold tracking-tight text-foreground'>ServeOS Admin</h1>
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

    if (!context.authUser.businessId && location.pathname !== '/setup')
      throw redirect({ to: '/setup' })

    if (context.authUser.businessId && location.pathname === '/setup')
      throw redirect({ to: '/dashboard' })
  },
})

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Orders', icon: ShoppingBag, href: '/orders' },
  { label: 'Tables', icon: TableIcon, href: '/tables' },
  { label: 'Menu', icon: UtensilsCrossed, href: '/menu' },
  { label: 'Service (KDS)', icon: ChefHat, href: '/kitchen' },
]

const otherItems = [
  { label: 'Staff', icon: Users, href: '/staff' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

function SidebarNavLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: Readonly<{
  item: (typeof menuItems)[0]
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

function AdminLayout() {
  const isCollapsed = false
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'>
              S
            </div>
            {!isCollapsed && <span className='text-xl uppercase'>ServeOS</span>}
          </Link>
        </div>

        <div className='flex-1 space-y-8 overflow-y-auto px-4 py-6'>
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
            <div className='flex items-center gap-3 rounded-xl border border-border p-1.5 pr-4'>
              <div className='h-9 w-9 overflow-hidden rounded-xl bg-muted'>
                <img src='/logo192.png' alt='User' className='h-full w-full object-cover' />
              </div>
              <div className='hidden flex-row items-center gap-2 sm:flex'>
                <span className='text-sm font-bold'>John Doe</span>
                <ChevronRight className='h-4 w-4 rotate-90 text-muted-foreground' />
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='relative h-11 w-11 rounded-xl bg-muted'
            >
              <Bell className='h-5 w-5 text-muted-foreground' />
              <span className='absolute right-3.5 top-3.5 flex h-2 w-2 rounded-full border-2 border-white bg-red-500' />
            </Button>
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
