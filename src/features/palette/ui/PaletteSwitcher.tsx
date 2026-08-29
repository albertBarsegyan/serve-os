import { Check, Palette } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { PALETTES } from '#/features/palette/lib/palettes'
import { usePaletteStore } from '#/features/palette/model/palette-store'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type PaletteSwitcherProps = {
  triggerClassName?: string
}

export function PaletteSwitcher({ triggerClassName }: PaletteSwitcherProps) {
  const { palette, setPalette } = usePaletteStore()

  return (
    <Popover>
      <PopoverTrigger
        aria-label={m.shared_palette_switcher_change()}
        title={m.shared_palette_switcher_change()}
        className={cn(
          'cursor-pointer flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
          triggerClassName,
        )}
      >
        <Palette size={22} />
      </PopoverTrigger>
      <PopoverContent className='w-auto p-3' align='end'>
        <p className='mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
          {m.shared_palette_switcher_heading()}
        </p>
        <div className='grid grid-cols-5 gap-2'>
          {PALETTES.map((p) => {
            const isActive = p.id === palette
            return (
              <button
                key={p.id}
                type='button'
                title={p.label}
                aria-label={
                  isActive
                    ? m.shared_palette_option_aria_active({ label: p.label })
                    : m.shared_palette_option_aria({ label: p.label })
                }
                onClick={() => setPalette(p.id)}
                className={cn(
                  'relative h-9 w-9 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background scale-110',
                )}
                style={{
                  background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)`,
                }}
              >
                {isActive && (
                  <span className='absolute inset-0 flex items-center justify-center'>
                    <Check size={14} className='text-white drop-shadow-md' />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
