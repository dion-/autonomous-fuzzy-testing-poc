import { useState } from "react";
import type { FormData } from "../hooks/useFormState";
import { calculateDiscount } from "../utils/validators";

interface SummaryProps {
  data: FormData;
}

export function Summary({ data }: SummaryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const discount = calculateDiscount(data.preferences.promoCode);
  const subtotal = 99.99;
  const discountAmount = subtotal * discount;
  const shippingCost = data.shipping.shippingMethod === "express" ? 9.99 : 0;
  const total = subtotal - discountAmount + shippingCost + (data.preferences.giftWrap ? 5.0 : 0);

  return (
    <aside
      aria-label="Order summary"
      className="rounded-xl border border-gray-200 bg-white overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          Order Summary
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
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
            {shippingCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
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
      )}
    </aside>
  );
}
