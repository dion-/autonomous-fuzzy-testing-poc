import type { FormData } from '../hooks/useFormState'
import { calculateDiscount } from '../utils/validators'

interface Step3Props {
  data: FormData['preferences']
  onChange: (field: keyof FormData['preferences'], value: string | boolean) => void
}

export function Step3({ data, onChange }: Step3Props) {
  const discount = calculateDiscount(data.promoCode)

  return (
    <fieldset>
      <legend>Preferences</legend>
      <label htmlFor="newsletter">
        <input
          id="newsletter"
          type="checkbox"
          checked={data.newsletter}
          onChange={(e) => onChange('newsletter', e.target.checked)}
        />
        Subscribe to newsletter
      </label>
      <label htmlFor="giftWrap">
        <input
          id="giftWrap"
          type="checkbox"
          checked={data.giftWrap}
          onChange={(e) => onChange('giftWrap', e.target.checked)}
        />
        Add gift wrap
      </label>
      <label htmlFor="deliveryInstructions">
        Delivery Instructions
        <textarea
          id="deliveryInstructions"
          rows={4}
          value={data.deliveryInstructions}
          onChange={(e) => onChange('deliveryInstructions', e.target.value)}
        />
      </label>
      <label htmlFor="promoCode">
        Promo Code
        <input
          id="promoCode"
          type="text"
          value={data.promoCode}
          onChange={(e) => onChange('promoCode', e.target.value)}
        />
        {discount > 0 && (
          <span role="status">{Math.round(discount * 100)}% discount applied</span>
        )}
      </label>
    </fieldset>
  )
}
