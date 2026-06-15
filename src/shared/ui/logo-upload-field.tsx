import { ImageIcon, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '#/lib/utils'
import { ImageEditorDialog } from '#/shared/ui/image-editor-dialog'

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE = 3 * 1024 * 1024

interface LogoUploadFieldProps {
  currentUrl?: string | null
  onFileChange: (file: File | null) => void
  label?: string
  className?: string
  shape?: 'square' | 'circle'
}

export function LogoUploadField({
  currentUrl,
  onFileChange,
  label,
  className,
  shape = 'square',
}: LogoUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    setPreviewUrl(currentUrl ?? null)
  }, [currentUrl])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, and WebP files are allowed')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be under 3 MB')
      e.target.value = ''
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setEditorSrc(reader.result as string)
      setIsEditorOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleEditorSave = (croppedFile: File) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(croppedFile)
    blobUrlRef.current = url
    setPreviewUrl(url)
    onFileChange(croppedFile)
    setIsEditorOpen(false)
    setEditorSrc(null)
  }

  const handleEditorCancel = () => {
    setIsEditorOpen(false)
    setEditorSrc(null)
  }

  const handleRemove = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setPreviewUrl(null)
    onFileChange(null)
  }

  const isCircle = shape === 'circle'

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className='text-sm font-medium text-muted-foreground'>{label}</p>}

      <div className='flex items-center gap-4'>
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-input bg-muted',
            isCircle ? 'rounded-full' : 'rounded-xl',
          )}
        >
          {previewUrl ? (
            <img src={previewUrl} alt='preview' className='h-full w-full object-cover' />
          ) : (
            <ImageIcon className='h-8 w-8 text-muted-foreground/40' />
          )}
        </div>

        <div className='flex flex-col gap-2'>
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className='flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer'
          >
            <UploadCloud className='h-4 w-4' />
            Upload image
          </button>

          {previewUrl && (
            <button
              type='button'
              onClick={handleRemove}
              className='flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer'
            >
              <Trash2 className='h-4 w-4' />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className='text-xs text-red-600'>{error}</p>}

      <input
        ref={inputRef}
        type='file'
        accept='.png,.jpg,.jpeg,.webp'
        className='hidden'
        onChange={handleFileSelect}
      />

      <ImageEditorDialog
        imageSrc={editorSrc ?? ''}
        isOpen={isEditorOpen}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        aspectRatio={1}
      />
    </div>
  )
}
