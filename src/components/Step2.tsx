import type { FormData } from '../hooks/useFormState'
import { isNonEmpty, isValidPostalCode } from '../utils/validators'

interface Step2Props {
  data: FormData['shipping']
  onChange: (field: keyof FormData['shipping'], value: string) => void
}

const countries = [
  { code: '', label: 'Select a country' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'UK', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'AU', label: 'Australia' },
  { code: 'JP', label: 'Japan' },
  { code: 'OTHER', label: 'Other' },
]

export function Step2({ data, onChange }: Step2Props) {
  const errors = {
    country: !isNonEmpty(data.country),
    address: !isNonEmpty(data.address),
    city: !isNonEmpty(data.city),
    state: !isNonEmpty(data.state),
    postalCode: !isValidPostalCode(data.postalCode, data.country),
  }

  return (
    <fieldset>
      <legend>Shipping Address</legend>
      <label htmlFor="country">
        Country
        <select
          id="country"
          value={data.country}
          onChange={(e) => onChange('country', e.target.value)}
          aria-invalid={errors.country}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="address">
        Street Address
        <input
          id="address"
          type="text"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          aria-invalid={errors.address}
        />
      </label>
      <label htmlFor="city">
        City
        <input
          id="city"
          type="text"
          value={data.city}
          onChange={(e) => onChange('city', e.target.value)}
          aria-invalid={errors.city}
        />
      </label>
      <label htmlFor="state">
        State / Province / Region
        <input
          id="state"
          type="text"
          value={data.state}
          onChange={(e) => onChange('state', e.target.value)}
          aria-invalid={errors.state}
        />
      </label>
      <label htmlFor="postalCode">
        Postal Code
        <input
          id="postalCode"
          type="text"
          value={data.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          aria-invalid={errors.postalCode}
        />
      </label>
    </fieldset>
  )
}
