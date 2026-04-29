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
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import { useLogoutMutation } from '#/features/auth/model/auth-hooks.ts'
import { cn } from '#/lib/utils.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Button } from '#/shared/ui/Button.tsx'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary.tsx'

function AdminErrorComponent({ error }: { error: Error }) {
  return (
    <div className='flex min-h-screen flex-col bg-[#F8F9FD]'>
      <header className='flex h-20 items-center bg-white px-8 border-b border-[var(--line)]'>
        <h1 className='text-lg font-bold text-[#2D2D2D]'>ServeOS Admin</h1>
      </header>
      <main className='flex-1 overflow-y-auto p-8'>
        <ErrorBoundary error={error} />
      </main>
    </div>
  )
}

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  errorComponent: AdminErrorComponent,
  beforeLoad: ({ context }) => {
    const user = context.queryClient.getQueryData([authQueryKey.ME]) as AuthenticatedUser | null

    if (!user) throw redirect({ to: '/' })
  },
})

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
  { label: 'Tables', icon: TableIcon, href: '/admin/tables' },
  { label: 'Menu', icon: UtensilsCrossed, href: '/admin/menu' },
  { label: 'Service (KDS)', icon: ChefHat, href: '/admin/kitchen' },
]

const otherItems = [
  { label: 'Staff', icon: Users, href: '/admin/staff' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

function AdminLayout() {
  const [isCollapsed, _] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const logoutMutation = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()

      await navigate({ to: '/' })
      showSuccess(authUiMessage.SUCCESS_LOGOUT)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const NavLink = ({ item }: { item: (typeof menuItems)[0] }) => {
    const isActive = location?.pathname === item.href
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
          isActive
            ? 'bg-[#E8EBFD] text-[#5D5FEF]'
            : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]',
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <item.icon
          className={cn(
            'h-5 w-5 shrink-0',
            isActive ? 'text-[#5D5FEF]' : 'text-[var(--sea-ink-soft)]',
          )}
        />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <div className='flex min-h-screen bg-[#F8F9FD] text-[var(--sea-ink)]'>
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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--line)] bg-white transition-all duration-300 lg:static',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className='flex h-20 items-center px-8'>
          <Link
            to='/'
            className='flex items-center gap-3 font-black tracking-tighter text-[#2D2D2D]'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#5D5FEF] text-xs font-bold text-white'>
              S
            </div>
            {!isCollapsed && <span className='text-xl uppercase'>ServeOS</span>}
          </Link>
        </div>

        <div className='flex-1 space-y-8 overflow-y-auto px-4 py-6'>
          <div>
            {!isCollapsed && (
              <p className='mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-[#B0B0B0]'>
                Menu
              </p>
            )}
            <nav className='space-y-1'>
              {menuItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <p className='mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-[#B0B0B0]'>
                Others
              </p>
            )}
            <nav className='space-y-1'>
              {otherItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
              <Button
                type='button'
                variant='ghost'
                className={cn(
                  'w-full justify-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]',
                  isCollapsed && 'justify-center px-0',
                )}
                onClick={handleLogout}
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
              <Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]' />
              <input
                type='text'
                placeholder='Search'
                className='h-12 w-full rounded-xl border-none bg-[#F5F5F5] pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20'
              />
            </div>
          </div>

          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-3 rounded-xl border border-[var(--line)] p-1.5 pr-4'>
              <div className='h-9 w-9 overflow-hidden rounded-xl bg-amber-100'>
                <img src='/logo192.png' alt='User' className='h-full w-full object-cover' />
              </div>
              <div className='hidden flex-row items-center gap-2 sm:flex'>
                <span className='text-sm font-bold'>John Doe</span>
                <ChevronRight className='h-4 w-4 rotate-90 text-[var(--sea-ink-soft)]' />
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='relative h-11 w-11 rounded-xl bg-[#F5F5F5]'
            >
              <Bell className='h-5 w-5 text-[#B0B0B0]' />
              <span className='absolute right-3.5 top-3.5 flex h-2 w-2 rounded-full border-2 border-white bg-red-500' />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-8 scrollbar-hide'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
