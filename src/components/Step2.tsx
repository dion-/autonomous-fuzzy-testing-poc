import type { FormData } from "../hooks/useFormState";
import { getCountryFullName, isNonEmpty, isValidPostalCode } from "../utils/validators";

interface Step2Props {
  data: FormData["shipping"];
  onChange: (field: keyof FormData["shipping"], value: string) => void;
}

const countries = [
  { code: "", label: "Select a country" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "UK", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "OTHER", label: "Other" },
];

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

export function Step2({ data, onChange }: Step2Props) {
  const errors = {
    country: !isNonEmpty(data.country),
    address: !isNonEmpty(data.address),
    city: !isNonEmpty(data.city),
    state: !isNonEmpty(data.state),
    postalCode: !isValidPostalCode(data.postalCode, data.country),
  };

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">Shipping Address</legend>

      <div className="space-y-1.5">
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <div className="relative">
          <select
            id="country"
            value={data.country}
            onChange={(e) => onChange("country", e.target.value)}
            aria-invalid={errors.country}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white appearance-none"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </div>
        {data.country && (
          <p className="text-xs text-gray-500 mt-1">{getCountryFullName(data.country)}</p>
        )}
      </div>

      <InputRow
        id="address"
        label="Street Address"
        value={data.address}
        onChange={(v) => onChange("address", v)}
        error={errors.address}
        placeholder="123 Main Street"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputRow
          id="city"
          label="City"
          value={data.city}
          onChange={(v) => onChange("city", v)}
          error={errors.city}
          placeholder="San Francisco"
        />
        <InputRow
          id="state"
          label="State / Province / Region"
          value={data.state}
          onChange={(v) => onChange("state", v)}
          error={errors.state}
          placeholder="California"
        />
      </div>

      <InputRow
        id="postalCode"
        label="Postal Code"
        value={data.postalCode}
        onChange={(v) => onChange("postalCode", v)}
        error={errors.postalCode}
        placeholder="94102"
      />
    </fieldset>
  );
}
