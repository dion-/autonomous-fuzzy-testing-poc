import type { FormData } from "../hooks/useFormState";
import { calculateDiscount } from "../utils/validators";

interface Step3Props {
  data: FormData["preferences"];
  onChange: (field: keyof FormData["preferences"], value: string | boolean) => void;
}

export function Step3({ data, onChange }: Step3Props) {
  const discount = calculateDiscount(data.promoCode);

  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Preferences</legend>

      <div className="space-y-4">
        <label htmlFor="newsletter" className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              id="newsletter"
              type="checkbox"
              checked={data.newsletter}
              onChange={(e) => onChange("newsletter", e.target.checked)}
              className="peer h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-200 cursor-pointer"
            />
          </div>
          <div className="space-y-0.5">
            <span className="block text-sm font-medium text-gray-900">Subscribe to newsletter</span>
            <span className="block text-xs text-gray-500">
              Get updates on new products and exclusive offers.
            </span>
          </div>
        </label>

        <label htmlFor="giftWrap" className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              id="giftWrap"
              type="checkbox"
              checked={data.giftWrap}
              onChange={(e) => onChange("giftWrap", e.target.checked)}
              className="peer h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-200 cursor-pointer"
            />
          </div>
          <div className="space-y-0.5">
            <span className="block text-sm font-medium text-gray-900">Add gift wrap</span>
            <span className="block text-xs text-gray-500">Beautiful wrapping for $5.00.</span>
          </div>
        </label>

        {data.giftWrap && (
          <div className="space-y-1.5 pl-8">
            <label htmlFor="giftMessage" className="block text-sm font-medium text-gray-700">
              Gift Message
            </label>
            <textarea
              id="giftMessage"
              rows={3}
              maxLength={150}
              value={data.giftMessage}
              onChange={(e) => onChange("giftMessage", e.target.value)}
              placeholder="Write a personal message for the recipient..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-y"
            />
            <p
              aria-live="polite"
              className={`text-xs ${data.giftMessage.length >= 150 ? "text-red-500" : "text-gray-500"}`}
            >
              {data.giftMessage.length} / 150 characters
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700">
          Delivery Instructions
        </label>
        <textarea
          id="deliveryInstructions"
          rows={4}
          maxLength={200}
          value={data.deliveryInstructions}
          onChange={(e) => onChange("deliveryInstructions", e.target.value)}
          placeholder="Leave at the front door, ring the bell, etc."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-y"
        />
        <p
          aria-live="polite"
          className={`text-xs ${data.deliveryInstructions.length >= 200 ? "text-red-500" : "text-gray-500"}`}
        >
          {data.deliveryInstructions.length} / 200 characters
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700">
          Promo Code
        </label>
        <div className="flex gap-3">
          <input
            id="promoCode"
            type="text"
            value={data.promoCode}
            onChange={(e) => onChange("promoCode", e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          <button
            type="button"
            onClick={() => onChange("promoCode", "")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
        {discount > 0 && (
          <p role="status" className="text-xs text-green-600 font-medium">
            {Math.round(discount * 100)}% discount applied
          </p>
        )}
      </div>
    </fieldset>
  );
}
