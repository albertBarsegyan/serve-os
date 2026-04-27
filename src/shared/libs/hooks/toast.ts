// Simple global toast methods
import { toast } from 'sonner'

export const showSuccess = (message: string) => {
  toast.success('Success!', {
    description: message,
    position: 'top-right',
  })
}

export const showError = (message: string) => {
  toast.error('Went wrong!', {
    description: message,
    position: 'top-right',
  })
}

export const showInfo = (message: string) => {
  toast.info('Info', {
    description: message,
    position: 'top-right',
  })
}
