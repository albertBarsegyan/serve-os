import { RotateCcw, RotateCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Area, Point } from 'react-easy-crop'
import Cropper from 'react-easy-crop'
import { Button } from '#/components/ui/button'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock'

interface ImageEditorDialogProps {
  imageSrc: string
  isOpen: boolean
  onSave: (file: File) => void
  onCancel: () => void
  aspectRatio?: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = src
  })
}

async function getCroppedFile(imageSrc: string, pixelCrop: Area, rotation: number): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Could not get canvas context')

  const maxSize = Math.max(image.naturalWidth, image.naturalHeight)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(
    image,
    safeArea / 2 - image.naturalWidth * 0.5,
    safeArea / 2 - image.naturalHeight * 0.5,
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.naturalWidth * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.naturalHeight * 0.5 - pixelCrop.y),
  )

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(new File([blob], 'logo.png', { type: 'image/png' }))
      },
      'image/png',
      0.92,
    )
  })
}

function EditorOverlay({
  imageSrc,
  onSave,
  onCancel,
  aspectRatio,
}: Readonly<Omit<ImageEditorDialogProps, 'isOpen'>>) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useBodyScrollLock(true)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    try {
      const file = await getCroppedFile(imageSrc, croppedAreaPixels, rotation)
      onSave(file)
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <button
        type='button'
        aria-label='Close editor'
        className='fixed inset-0 bg-background/80 backdrop-blur-sm'
        onClick={onCancel}
      />

      <div className='relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg'>
        <h2 className='mb-4 text-lg font-semibold'>Edit Image</h2>

        <div className='relative h-64 w-full overflow-hidden rounded-lg bg-black/10'>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className='mt-5 space-y-4'>
          <div className='flex items-center gap-3'>
            <span className='w-18 shrink-0 text-sm text-muted-foreground'>Zoom</span>
            <input
              type='range'
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className='h-2 w-full cursor-pointer accent-foreground'
            />
            <span className='w-8 text-right text-xs text-muted-foreground'>{zoom.toFixed(1)}×</span>
          </div>

          <div className='flex items-center gap-3'>
            <span className='w-18 shrink-0 text-sm text-muted-foreground'>Rotation</span>
            <input
              type='range'
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className='h-2 w-full cursor-pointer accent-foreground'
            />
            <div className='flex w-8 justify-end gap-1'>
              <button
                type='button'
                onClick={() => setRotation((r) => r - 90)}
                className='text-muted-foreground hover:text-foreground transition-colors'
                title='Rotate -90°'
              >
                <RotateCcw className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={() => setRotation((r) => r + 90)}
                className='text-muted-foreground hover:text-foreground transition-colors'
                title='Rotate +90°'
              >
                <RotateCw className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <Button variant='ghost' onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Applying…' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ImageEditorDialog({ isOpen, imageSrc, ...rest }: ImageEditorDialogProps) {
  if (!(isOpen && imageSrc)) return null
  return <EditorOverlay imageSrc={imageSrc} {...rest} />
}
