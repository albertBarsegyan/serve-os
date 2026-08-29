// Simple global toast methods
import { toast } from 'sonner'
import { m } from '#/paraglide/messages'

export const showSuccess = (message: string) => {
  toast.success(m.shared_toast_success_title(), {
    description: message,
    position: 'top-right',
  })
}

export const showError = (message: string) => {
  toast.error(m.shared_toast_error_title(), {
    description: message,
    position: 'top-right',
  })
}

export const showInfo = (message: string) => {
  toast.info(m.shared_toast_info_title(), {
    description: message,
    position: 'top-right',
  })
}
