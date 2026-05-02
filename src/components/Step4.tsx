import type { FormData } from '../hooks/useFormState'
import { calculateDiscount } from '../utils/validators'

interface Step4Props {
  data: FormData
  onSubmit: () => void
  onEdit: (step: number) => void
}

export function Step4({ data, onSubmit, onEdit }: Step4Props) {
  const discount = calculateDiscount(data.preferences.promoCode)
  const subtotal = 99.99
  const discountAmount = subtotal * discount
  const total = subtotal - discountAmount + (data.preferences.giftWrap ? 5.0 : 0)

  return (
    <fieldset>
      <legend>Review Your Order</legend>
      <section>
        <h3>Personal</h3>
        <p>
          {data.personal.firstName} {data.personal.lastName}
        </p>
        <p>{data.personal.email}</p>
        <p>{data.personal.phone}</p>
        <button type="button" onClick={() => onEdit(0)}>
          Edit
        </button>
      </section>
      <section>
        <h3>Shipping</h3>
        <p>{data.shipping.address}</p>
        <p>
          {data.shipping.city}, {data.shipping.state} {data.shipping.postalCode}
        </p>
        <p>{data.shipping.country}</p>
        <button type="button" onClick={() => onEdit(1)}>
          Edit
        </button>
      </section>
      <section>
        <h3>Preferences</h3>
        <p>Newsletter: {data.preferences.newsletter ? 'Yes' : 'No'}</p>
        <p>Gift wrap: {data.preferences.giftWrap ? 'Yes' : 'No'}</p>
        {data.preferences.deliveryInstructions && (
          <p>Instructions: {data.preferences.deliveryInstructions}</p>
        )}
        {data.preferences.promoCode && (
          <p>Promo: {data.preferences.promoCode}</p>
        )}
        <button type="button" onClick={() => onEdit(2)}>
          Edit
        </button>
      </section>
      <section>
        <h3>Total</h3>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        {discountAmount > 0 && <p>Discount: -${discountAmount.toFixed(2)}</p>}
        {data.preferences.giftWrap && <p>Gift wrap: $5.00</p>}
        <p>
          <strong>Total: ${total.toFixed(2)}</strong>
        </p>
      </section>
      <button type="button" onClick={onSubmit}>
        Place Order
      </button>
    </fieldset>
  )
}
