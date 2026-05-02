import type { FormData } from "../hooks/useFormState";
import { isNonEmpty, isValidEmail, isValidPhone } from "../utils/validators";

interface Step1Props {
  data: FormData["personal"];
  onChange: (field: keyof FormData["personal"], value: string) => void;
}

function InputRow({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  error: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error}
        placeholder={placeholder}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          outline-none transition-colors
          ${
            error && value !== ""
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          }
          ${error && value === "" ? "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100" : ""}
        `}
      />
      {error && value !== "" && (
        <p className="text-xs text-red-500">Please enter a valid {label.toLowerCase()}.</p>
      )}
    </div>
  );
}

export function Step1({ data, onChange }: Step1Props) {
  const errors = {
    firstName: !isNonEmpty(data.firstName),
    lastName: !isNonEmpty(data.lastName),
    email: !isValidEmail(data.email),
    phone: !isValidPhone(data.phone),
  };

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">Personal Information</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputRow
          id="firstName"
          label="First Name"
          value={data.firstName}
          onChange={(v) => onChange("firstName", v)}
          error={errors.firstName}
          placeholder="Jane"
        />
        <InputRow
          id="lastName"
          label="Last Name"
          value={data.lastName}
          onChange={(v) => onChange("lastName", v)}
          error={errors.lastName}
          placeholder="Doe"
        />
      </div>
      <InputRow
        id="email"
        label="Email"
        type="email"
        value={data.email}
        onChange={(v) => onChange("email", v)}
        error={errors.email}
        placeholder="jane@example.com"
      />
      <InputRow
        id="phone"
        label="Phone"
        type="text"
        value={data.phone}
        onChange={(v) => onChange("phone", v)}
        error={errors.phone}
        placeholder="+1 (555) 000-0000"
      />
    </fieldset>
  );
}
