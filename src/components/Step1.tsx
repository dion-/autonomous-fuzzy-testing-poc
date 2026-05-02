import type { FormData } from '../hooks/useFormState'
import { isNonEmpty, isValidEmail, isValidPhone } from '../utils/validators'

interface Step1Props {
  data: FormData['personal']
  onChange: (field: keyof FormData['personal'], value: string) => void
}

export function Step1({ data, onChange }: Step1Props) {
  const errors = {
    firstName: !isNonEmpty(data.firstName),
    lastName: !isNonEmpty(data.lastName),
    email: !isValidEmail(data.email),
    phone: !isValidPhone(data.phone),
  }

  return (
    <fieldset>
      <legend>Personal Information</legend>
      <label htmlFor="firstName">
        First Name
        <input
          id="firstName"
          type="text"
          value={data.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          aria-invalid={errors.firstName}
        />
      </label>
      <label htmlFor="lastName">
        Last Name
        <input
          id="lastName"
          type="text"
          value={data.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          aria-invalid={errors.lastName}
        />
      </label>
      <label htmlFor="email">
        Email
        <input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          aria-invalid={errors.email}
        />
      </label>
      <label htmlFor="phone">
        Phone
        <input
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          aria-invalid={errors.phone}
        />
      </label>
    </fieldset>
  )
}
