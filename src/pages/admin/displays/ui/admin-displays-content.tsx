import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Monitor, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import type {
  DisplaySummaryResponse,
  DisplayWithUrlResponse,
} from '#/features/display/api/display.types.ts'
import {
  type CreateDisplayFormValues,
  createDisplaySchema,
} from '#/features/display/lib/schemas/create-display.schema.ts'
import {
  useCreateDisplayMutation,
  useDisplaysQuery,
  useRegenerateDisplayMutation,
  useRevokeDisplayMutation,
} from '#/features/display/model/display-hooks.ts'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Modal } from '#/shared/ui/modal'

function RevealUrlModal({
  display,
  onClose,
}: Readonly<{ display: DisplayWithUrlResponse | null; onClose: () => void }>) {
  const copyLink = () => {
    if (!display) return
    navigator.clipboard.writeText(display.url)
    showSuccess(m.admin_displays_link_copied())
  }

  return (
    <Modal
      isOpen={display !== null}
      onClose={onClose}
      title={display ? m.admin_displays_ready_title({ name: display.name }) : ''}
      footer={
        <>
          <Button variant='ghost' onClick={onClose}>
            {m.admin_displays_done()}
          </Button>
          <Button onClick={copyLink}>
            <Copy className='mr-2 h-4 w-4' /> {m.admin_displays_copy_link()}
          </Button>
        </>
      }
    >
      <div className='space-y-3'>
        <p className='text-sm text-muted-foreground'>{m.admin_displays_reveal_description()}</p>
        <div className='rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs break-all'>
          {display?.url}
        </div>
      </div>
    </Modal>
  )
}

function CreateDisplayForm({
  businessId,
  onCreated,
}: Readonly<{ businessId: string; onCreated: (display: DisplayWithUrlResponse) => void }>) {
  const createMutation = useCreateDisplayMutation(businessId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDisplayFormValues>({
    resolver: zodResolver(createDisplaySchema),
    defaultValues: { name: '' },
  })

  const onSubmit = async (values: CreateDisplayFormValues) => {
    try {
      const created = await createMutation.mutateAsync(values)
      reset()
      onCreated(created)
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <form
      className='flex flex-col gap-3 sm:flex-row sm:items-end'
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit(onSubmit)()
      }}
    >
      <div className='flex-1 space-y-1'>
        <label htmlFor='display-name' className='text-sm font-medium'>
          {m.admin_displays_name_label()}
        </label>
        <Input
          id='display-name'
          placeholder={m.admin_displays_name_placeholder()}
          {...register('name')}
        />
        {errors.name && <p className='text-xs text-red-600'>{errors.name.message}</p>}
      </div>
      <Button type='submit' className='rounded-full' disabled={createMutation.isPending}>
        <Plus className='mr-2 h-4 w-4' />
        {createMutation.isPending ? m.admin_displays_creating() : m.admin_displays_create_button()}
      </Button>
    </form>
  )
}

function DisplayRow({
  display,
  businessId,
  onRegenerated,
}: Readonly<{
  display: DisplaySummaryResponse
  businessId: string
  onRegenerated: (display: DisplayWithUrlResponse) => void
}>) {
  const regenerateMutation = useRegenerateDisplayMutation(businessId)
  const revokeMutation = useRevokeDisplayMutation(businessId)
  const isBusy = regenerateMutation.isPending || revokeMutation.isPending

  const handleRegenerate = async () => {
    try {
      const rotated = await regenerateMutation.mutateAsync(display.id)
      onRegenerated(rotated)
      showSuccess(m.admin_displays_link_regenerated())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync(display.id)
      showSuccess(m.admin_displays_revoked_toast())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='flex items-center justify-between gap-4 rounded-xl border border-border p-4'>
      <div className='flex items-center gap-3'>
        <div
          className={`rounded-xl p-2 ${
            display.revoked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
          }`}
        >
          <Monitor className='h-5 w-5' />
        </div>
        <div>
          <p className='flex items-center gap-2 text-sm font-semibold'>
            {display.name}
            {display.revoked && (
              <Badge variant='destructive'>{m.admin_displays_revoked_badge()}</Badge>
            )}
          </p>
          <p className='text-xs text-muted-foreground'>
            {m.admin_displays_created_on({
              date: new Date(display.createdAt).toLocaleDateString(),
            })}
          </p>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='rounded-full'
          disabled={isBusy}
          onClick={() => void handleRegenerate()}
        >
          <RefreshCw className='mr-1.5 h-3.5 w-3.5' />
          {display.revoked ? m.admin_displays_reactivate() : m.admin_displays_regenerate_link()}
        </Button>
        {!display.revoked && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-destructive'
            disabled={isBusy}
            onClick={() => void handleRevoke()}
            title={m.admin_displays_revoke()}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  )
}

export function AdminDisplaysContent() {
  const activeBusiness = useActiveBusiness()
  const businessId = activeBusiness?.id ?? ''
  const { data: displays = [], isPending } = useDisplaysQuery(businessId)
  const [revealedDisplay, setRevealedDisplay] = useState<DisplayWithUrlResponse | null>(null)

  if (!activeBusiness) {
    return (
      <div className='space-y-4'>
        <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_displays_title()}</h1>
        <p className='text-muted-foreground'>{m.admin_displays_no_business()}</p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_displays_title()}</h1>
        <p className='text-muted-foreground'>{m.admin_displays_subtitle()}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>{m.admin_displays_new_display()}</CardTitle>
          <CardDescription>{m.admin_displays_new_display_desc()}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDisplayForm businessId={businessId} onCreated={setRevealedDisplay} />
        </CardContent>
      </Card>

      {isPending ? (
        <div className='space-y-3'>
          {[1, 2].map((i) => (
            <div key={i} className='h-20 animate-pulse rounded-xl bg-muted' />
          ))}
        </div>
      ) : displays.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{m.admin_displays_empty()}</p>
      ) : (
        <div className='space-y-3'>
          {displays.map((display) => (
            <DisplayRow
              key={display.id}
              display={display}
              businessId={businessId}
              onRegenerated={setRevealedDisplay}
            />
          ))}
        </div>
      )}

      <RevealUrlModal display={revealedDisplay} onClose={() => setRevealedDisplay(null)} />
    </div>
  )
}
