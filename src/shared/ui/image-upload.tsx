import { ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { type ImageEntityType, uploadImage } from '#/shared/api/images/images.api'
import { ImageEditorDialog } from '#/shared/ui/image-editor-dialog'

const ALLOWED_MIME_TYPES = new Set(['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'])
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB

type ImageUploadProps = {
  value: string | null | undefined
  onChange: (url: string | null) => void
  entityType: ImageEntityType
  /** Required only when uploading on behalf of a specific staff member. */
  entityId?: string
  label?: string
  className?: string
  previewShape?: 'square' | 'circle'
  enableEditor?: boolean
  id?: string
}

export function ImageUpload({
  value,
  onChange,
  entityType,
  entityId,
  label,
  className,
  previewShape = 'square',
  enableEditor = false,
  id,
}: Readonly<ImageUploadProps>) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doUpload = async (file: File) => {
    setError(null)
    setIsUploading(true)
    try {
      const uploaded = await uploadImage(file, { entityType, entityId })
      onChange(uploaded.url)
    } catch {
      setError(m.shared_image_upload_failed())
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError(m.shared_image_upload_invalid_type())
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(m.shared_image_upload_too_large())
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (enableEditor) {
      setError(null)
      const reader = new FileReader()
      reader.onload = () => {
        setEditorSrc(reader.result as string)
        setIsEditorOpen(true)
      }
      reader.readAsDataURL(file)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    await doUpload(file)
  }

  const handleEditorSave = async (croppedFile: File) => {
    setIsEditorOpen(false)
    setEditorSrc(null)
    await doUpload(croppedFile)
  }

  const isCircle = previewShape === 'circle'

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className='text-sm font-medium text-muted-foreground'>{label}</p>}

      <div className='flex items-center gap-4'>
        {/* Preview */}
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-input bg-muted',
            isCircle ? 'rounded-full' : 'rounded-xl',
          )}
        >
          {value ? (
            <img
              src={value}
              alt={m.shared_image_upload_preview_alt()}
              className='h-full w-full object-cover'
            />
          ) : (
            <ImageIcon className='h-8 w-8 text-muted-foreground/40' />
          )}
        </div>

        <div className='flex flex-col gap-2'>
          <button
            type='button'
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className='flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer'
          >
            {isUploading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <UploadCloud className='h-4 w-4' />
            )}
            {isUploading ? m.shared_image_upload_uploading() : m.shared_image_upload_button()}
          </button>

          {value && (
            <button
              type='button'
              onClick={() => onChange(null)}
              className='flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer'
            >
              <Trash2 className='h-4 w-4' />
              {m.shared_image_upload_remove()}
            </button>
          )}
        </div>
      </div>

      {error && <p className='text-xs text-red-600'>{error}</p>}

      <input
        id={id}
        ref={inputRef}
        type='file'
        accept='.svg,.png,.jpg,.jpeg,.webp'
        className='hidden'
        onChange={handleFileChange}
      />

      {enableEditor && (
        <ImageEditorDialog
          imageSrc={editorSrc ?? ''}
          isOpen={isEditorOpen}
          onSave={handleEditorSave}
          onCancel={() => {
            setIsEditorOpen(false)
            setEditorSrc(null)
          }}
          aspectRatio={1}
        />
      )}
    </div>
  )
}
