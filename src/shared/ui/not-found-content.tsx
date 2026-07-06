import { Link } from '@tanstack/react-router'
import { AlertTriangle, Home } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

export function NotFoundContent() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='text-center max-w-lg'>
        <div className='mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10'>
          <AlertTriangle className='h-8 w-8 text-amber-600' />
        </div>
        <h1 className='mb-2 text-4xl font-semibold tracking-tight text-foreground'>404</h1>
        <h2 className='mb-4 text-2xl font-semibold tracking-tight text-foreground'>
          {m.shared_not_found_title()}
        </h2>
        <p className='mb-8 leading-relaxed text-muted-foreground'>{m.shared_not_found_message()}</p>
        <div className='flex flex-col gap-3 sm:flex-row justify-center'>
          <Link to='/'>
            <Button className='flex items-center justify-center gap-2 w-full sm:w-auto'>
              <Home className='h-4 w-4' />
              {m.shared_not_found_go_home()}
            </Button>
          </Link>
          <Button
            variant='outline'
            onClick={() => globalThis.history.back()}
            className='w-full sm:w-auto'
          >
            {m.shared_not_found_go_back()}
          </Button>
        </div>
      </div>
    </div>
  )
}
