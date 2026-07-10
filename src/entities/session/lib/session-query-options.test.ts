import { describe, expect, it } from 'vitest'
import { sessionQueryOptions } from './session-query-options'

describe('sessionQueryOptions', () => {
  it('scopes the query key to the resolved session token', () => {
    // The route loader seeds this exact key via ensureQueryData right after a QR scan
    // resolves a sessionToken — useSessionRealtime's session-closed handler invalidates
    // the same key, so the two must agree on shape or the closed-session screen never triggers.
    expect(sessionQueryOptions('token-1').queryKey).toEqual(['session', 'token-1'])
    expect(sessionQueryOptions('token-2').queryKey).toEqual(['session', 'token-2'])
  })

  it('is disabled until a session token has actually been resolved', () => {
    expect(sessionQueryOptions('').enabled).toBe(false)
    expect(sessionQueryOptions('token-1').enabled).toBe(true)
  })
})
