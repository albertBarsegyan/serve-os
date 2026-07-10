import { m } from '#/paraglide/messages'
import { C } from '../customer-theme'

interface SessionClosedViewProps {
  tableName: string
  onRetry: () => void
}

/**
 * Shown when the table's session was closed server-side (staff closed the table,
 * or the previous order was settled) while this device was still browsing. Without
 * this the guest would be stuck on a menu/cart that talks to a session the backend
 * has already torn down.
 */
export function SessionClosedView({ tableName, onRetry }: Readonly<SessionClosedViewProps>) {
  return (
    <div
      className='c-page'
      style={{
        background: C.bg,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(148,163,184,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto',
        }}
      >
        👋
      </div>
      <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: 0 }}>
        {m.customer_session_ended_title()}
      </h1>
      <p style={{ color: C.w40, fontSize: 13, margin: 0, maxWidth: 320 }}>
        {m.customer_session_ended_body()}
      </p>
      <p style={{ color: C.w30, fontSize: 11, margin: 0 }}>
        {m.customer_table({ name: tableName })}
      </p>
      <button
        type='button'
        onClick={onRetry}
        style={{
          marginTop: 8,
          width: '100%',
          maxWidth: 320,
          padding: '16px',
          background: C.amberGrad,
          borderRadius: C.r16,
          border: 'none',
          color: '#fff',
          fontWeight: 800,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: C.shadowAmber,
        }}
      >
        {m.customer_session_ended_retry()}
      </button>
    </div>
  )
}
