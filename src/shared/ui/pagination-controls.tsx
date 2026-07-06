import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const LIMIT_OPTIONS = [10, 20, 50] as const
export type PageLimit = (typeof LIMIT_OPTIONS)[number]

interface PaginationControlsProps {
  page: number
  limit: PageLimit
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: PageLimit) => void
  className?: string
}

export function PaginationControls({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  className,
}: Readonly<PaginationControlsProps>) {
  if (total === 0) return null

  const from = Math.min((page - 1) * limit + 1, total)
  const to = Math.min(page * limit, total)

  const pages = buildPageWindow(page, totalPages)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row',
        className,
      )}
    >
      {/* Count + per-page */}
      <div className='flex items-center gap-3 text-sm text-muted-foreground'>
        <span>{m.shared_pagination_range({ from, to, total })}</span>
        <div className='flex items-center gap-1.5'>
          <span className='text-xs'>{m.shared_pagination_per_page()}</span>
          <div className='flex rounded-lg border border-border bg-background'>
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type='button'
                onClick={() => {
                  onLimitChange(opt)
                  onPageChange(1)
                }}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                  opt === limit
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className='flex items-center gap-1'>
          <button
            type='button'
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className='flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40'
            aria-label={m.shared_pagination_previous_aria()}
          >
            <ChevronLeft className='h-4 w-4' />
          </button>

          {pages.map((p, i) =>
            p === '…' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis is positional
              <span key={`ellipsis-${i}`} className='px-1 text-sm text-muted-foreground'>
                …
              </span>
            ) : (
              <button
                key={p}
                type='button'
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
                  p === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {p}
              </button>
            ),
          )}

          <button
            type='button'
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className='flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40'
            aria-label={m.shared_pagination_next_aria()}
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      )}
    </div>
  )
}

function buildPageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  pages.push(1)
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
