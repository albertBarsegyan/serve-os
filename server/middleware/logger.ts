import { defineEventHandler } from 'nitro/h3'
import { logger } from '#/shared/libs/logger.server.ts'

const SKIP_PATTERN = /^\/@(?:vite|fs|id|tanstack)\//

export default defineEventHandler((event) => {
  const { method, url } = event?.node?.req ?? {}

  if (!url || SKIP_PATTERN.test(url)) return

  const start = Date.now()

  logger.info({ method, url }, 'incoming')
  if (event.node?.res) {
    event.node.res.on('finish', () => {
      const status = event?.node?.res?.statusCode ?? 0
      const ms = Date.now() - start
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
      logger[level]({ method, url, status, ms }, 'response')
    })
  }
})
