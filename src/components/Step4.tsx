import type { FormData } from "../hooks/useFormState";
import { calculateDiscount, formatPhone, getShippingLabel } from "../utils/validators";

interface Step4Props {
  data: FormData;
  onSubmit: () => void;
  onEdit: (step: number) => void;
}

function ReviewSection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="text-sm text-gray-600 space-y-0.5">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}

export function Step4({ data, onSubmit, onEdit }: Step4Props) {
  const discount = calculateDiscount(data.preferences.promoCode);
  const subtotal = 99.99;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount + (data.preferences.giftWrap ? 5.0 : 0);

  return (
    <fieldset>
      <legend className="sr-only">Review Your Order</legend>

      <div className="divide-y divide-gray-100">
        <ReviewSection title="Personal" onEdit={() => onEdit(0)}>
          <p>
            {data.personal.firstName} {data.personal.lastName}
          </p>
          <p>{data.personal.email}</p>
          <p>{formatPhone(data.personal.phone)}</p>
        </ReviewSection>

        <ReviewSection title="Shipping" onEdit={() => onEdit(1)}>
          <p>{data.shipping.address}</p>
          <p>
            {data.shipping.city}, {data.shipping.state} {data.shipping.postalCode}
          </p>
          <p>{data.shipping.country}</p>
          <p>{getShippingLabel(data.shipping.country)}</p>
        </ReviewSection>

        <ReviewSection title="Preferences" onEdit={() => onEdit(2)}>
          <p>Newsletter: {data.preferences.newsletter ? "Yes" : "No"}</p>
          <p>Gift wrap: {data.preferences.giftWrap ? "Yes" : "No"}</p>
          {data.preferences.deliveryInstructions && (
            <p>Instructions: {data.preferences.deliveryInstructions}</p>
          )}
          {data.preferences.promoCode && <p>Promo: {data.preferences.promoCode}</p>}
        </ReviewSection>

        <div className="py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Total</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {data.preferences.giftWrap && (
              <div className="flex justify-between text-gray-600">
                <span>Gift wrap</span>
                <span>$5.00</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-semibold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        Place Order
      </button>
    </fieldset>
  );
}
