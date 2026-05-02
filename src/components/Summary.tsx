import { useState } from 'react'
import type { FormData } from '../hooks/useFormState'
import { calculateDiscount } from '../utils/validators'

interface SummaryProps {
  data: FormData
}

export function Summary({ data }: SummaryProps) {
  const [collapsed, setCollapsed] = useState(false)
  const discount = calculateDiscount(data.preferences.promoCode)
  const subtotal = 99.99
  const discountAmount = subtotal * discount
  const total = subtotal - discountAmount + (data.preferences.giftWrap ? 5.0 : 0)

  return (
    <aside aria-label="Order summary">
      <button type="button" onClick={() => setCollapsed((c) => !c)}>
        {collapsed ? 'Show' : 'Hide'} Order Summary
      </button>
      {!collapsed && (
        <div>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          {discountAmount > 0 && <p>Discount: -${discountAmount.toFixed(2)}</p>}
          {data.preferences.giftWrap && <p>Gift wrap: $5.00</p>}
          <p>
            <strong>Total: ${total.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </aside>
  )
}
