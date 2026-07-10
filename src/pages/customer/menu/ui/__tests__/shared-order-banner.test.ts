import { describe, expect, it } from 'vitest'
import { nextSharedOrderBanner } from '../customer-menu-content'

describe('nextSharedOrderBanner', () => {
  it('surfaces a banner when another device at the table places an order', () => {
    const result = nextSharedOrderBanner(null, 'created', 'order-1', 'Order placed')
    expect(result).toEqual({ orderId: 'order-1', label: 'Order placed' })
  })

  it('updates the label as the order progresses through non-terminal transitions', () => {
    const placed = nextSharedOrderBanner(null, 'created', 'order-1', 'Order placed')
    const preparing = nextSharedOrderBanner(placed, 'preparing', 'order-1', 'Preparing')
    expect(preparing).toEqual({ orderId: 'order-1', label: 'Preparing' })
  })

  it('clears the banner once the tracked order reaches a terminal state', () => {
    const active = nextSharedOrderBanner(null, 'created', 'order-1', 'Order placed')
    const served = nextSharedOrderBanner(active, 'served', 'order-1', '')
    expect(served).toBeNull()
  })

  it('ignores a terminal event for an order that is not the currently tracked one', () => {
    const active = nextSharedOrderBanner(null, 'created', 'order-1', 'Order placed')
    const stillActive = nextSharedOrderBanner(active, 'cancelled', 'order-2', '')
    expect(stillActive).toEqual({ orderId: 'order-1', label: 'Order placed' })
  })

  it('starts tracking a new order that arrives while none is currently active', () => {
    const result = nextSharedOrderBanner(null, 'confirmed', 'order-1', 'Confirmed')
    expect(result).toEqual({ orderId: 'order-1', label: 'Confirmed' })
  })
})
