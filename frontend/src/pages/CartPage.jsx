import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LoadingInlineLabel } from "../components/AppLoading";
import { SelectField } from "../components/SelectField";
import { useStore } from "../context/StoreContext";

const CHECKOUT_PROFILE_KEY = "sirdavid-checkout-profile";
const paymentMethodOptions = [
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ussd", label: "USSD" },
  { value: "apple_pay", label: "Apple Pay (Safari)" },
];

function inferDefaultPaymentMethod() {
  if (typeof navigator === "undefined") {
    return "card";
  }

  const normalized = navigator.userAgent.toLowerCase();
  const appleDevice = ["iphone", "ipad", "macintosh"].some((token) => normalized.includes(token));
  const safari = normalized.includes("safari") && !normalized.includes("chrome") && !normalized.includes("crios");
  return appleDevice && safari ? "apple_pay" : "card";
}

function readCheckoutProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(CHECKOUT_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

export function CartPage() {
  const {
    cartLines,
    subtotalUsd,
    shippingUsd,
    totalUsd,
    shippingConfig,
    currentCurrency,
    checkoutPending,
    updateCartQuantity,
    removeFromCart,
    beginHostedCheckout,
    formatPrice,
  } = useStore();
  const [checkoutProfile, setCheckoutProfile] = useState(() => {
    const stored = readCheckoutProfile();
    return (
      stored || {
        customer: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
        },
        address: {
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "Nigeria",
          postalCode: "",
          deliveryInstructions: "",
        },
        paymentMethod: inferDefaultPaymentMethod(),
      }
    );
  });
  const settlementCurrency = import.meta.env.VITE_PAYSTACK_SETTLEMENT_CURRENCY || "NGN";
  const checkoutNote = useMemo(() => {
    if (currentCurrency === settlementCurrency) {
      return `Paystack checkout will settle in ${settlementCurrency}.`;
    }
    return `Displayed prices are converted estimates. Paystack checkout will settle in ${settlementCurrency}.`;
  }, [currentCurrency, settlementCurrency]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(checkoutProfile));
    }
  }, [checkoutProfile]);

  function updateCustomerField(field, value) {
    setCheckoutProfile((current) => ({
      ...current,
      customer: {
        ...current.customer,
        [field]: value,
      },
    }));
  }

  function updateAddressField(field, value) {
    setCheckoutProfile((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  }

  function beginCheckout() {
    beginHostedCheckout({
      customer: {
        first_name: checkoutProfile.customer.firstName,
        last_name: checkoutProfile.customer.lastName,
        email: checkoutProfile.customer.email,
        phone: checkoutProfile.customer.phone,
      },
      address: {
        address_line1: checkoutProfile.address.addressLine1,
        address_line2: checkoutProfile.address.addressLine2,
        city: checkoutProfile.address.city,
        state: checkoutProfile.address.state,
        country: checkoutProfile.address.country,
        postal_code: checkoutProfile.address.postalCode,
        delivery_instructions: checkoutProfile.address.deliveryInstructions,
      },
      paymentMethod: checkoutProfile.paymentMethod,
    });
  }

  if (!cartLines.length) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="rounded-full border border-white/10 bg-white/5 p-4 text-sky-300">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Your cart is empty.</h1>
        <p className="max-w-xl text-base leading-8 text-slate-300">
          Add a premium device or accessory to begin checkout. Orders will only be confirmed after the Paystack webhook verifies payment.
        </p>
        <Link
          to="/shop"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 pb-32 md:px-6 md:py-16 md:pb-16 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300 md:text-xs md:tracking-[0.35em]">
            Cart
          </p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Your premium checkout shortlist
          </h1>
        </div>

        <div className="space-y-4">
          {cartLines.map((item) => (
            <article
              key={item.id}
              className="section-frame grid gap-4 rounded-[26px] p-4 sm:grid-cols-[140px_1fr] lg:grid-cols-[140px_1fr_auto]"
            >
              <img
                src={item.image}
                alt={item.name}
                className="aspect-[4/3] w-full rounded-[22px] object-cover sm:h-36 sm:aspect-auto sm:rounded-[24px]"
              />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300 md:text-xs md:tracking-[0.3em]">
                    {item.brand}
                  </p>
                  <span className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm font-semibold text-white md:min-h-0 md:text-xs">
                    {item.condition}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">{item.name}</h2>
                <p className="text-sm leading-7 text-slate-300">{item.shortDescription}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end lg:justify-between">
                <p className="text-xl font-semibold text-white sm:text-2xl">{formatPrice(item.lineTotalUsd)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="section-frame rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <div className="flex items-center gap-3 rounded-[24px] bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
            Secure checkout and delivery updates are handled in one premium flow.
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span className="font-semibold text-white">{formatPrice(subtotalUsd)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>
                Shipping{" "}
                <span className="text-slate-500">
                  ({shippingConfig.mode === "free-threshold" ? "threshold" : shippingConfig.mode})
                </span>
              </span>
              <span className="font-semibold text-white">{formatPrice(shippingUsd)}</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">Estimated total</span>
                <span className="text-3xl font-semibold text-white">{formatPrice(totalUsd)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-xl font-semibold text-white">Checkout details</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Enter the customer and delivery details Paystack and order confirmation need before you continue.
            </p>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">First name</span>
                  <input
                    value={checkoutProfile.customer.firstName}
                    onChange={(event) => updateCustomerField("firstName", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Last name</span>
                  <input
                    value={checkoutProfile.customer.lastName}
                    onChange={(event) => updateCustomerField("lastName", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Email</span>
                <input
                  type="email"
                  value={checkoutProfile.customer.email}
                  onChange={(event) => updateCustomerField("email", event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Phone number</span>
                <input
                  value={checkoutProfile.customer.phone}
                  onChange={(event) => updateCustomerField("phone", event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Address line 1</span>
                <input
                  value={checkoutProfile.address.addressLine1}
                  onChange={(event) => updateAddressField("addressLine1", event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Address line 2</span>
                <input
                  value={checkoutProfile.address.addressLine2}
                  onChange={(event) => updateAddressField("addressLine2", event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">City</span>
                  <input
                    value={checkoutProfile.address.city}
                    onChange={(event) => updateAddressField("city", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">State</span>
                  <input
                    value={checkoutProfile.address.state}
                    onChange={(event) => updateAddressField("state", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Country</span>
                  <input
                    value={checkoutProfile.address.country}
                    onChange={(event) => updateAddressField("country", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Postal code</span>
                  <input
                    value={checkoutProfile.address.postalCode}
                    onChange={(event) => updateAddressField("postalCode", event.target.value)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Delivery instructions</span>
                <textarea
                  value={checkoutProfile.address.deliveryInstructions}
                  onChange={(event) => updateAddressField("deliveryInstructions", event.target.value)}
                  rows={3}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-white">Payment method</span>
                <SelectField
                  value={checkoutProfile.paymentMethod}
                  onValueChange={(value) =>
                    setCheckoutProfile((current) => ({ ...current, paymentMethod: value }))
                  }
                  options={paymentMethodOptions}
                  placeholder="Choose payment method"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={beginCheckout}
            disabled={checkoutPending}
            className="mt-6 hidden min-h-11 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 md:block"
          >
            <LoadingInlineLabel
              loading={checkoutPending}
              idleLabel="Checkout with Paystack"
              loadingLabel="Redirecting..."
              minWidthClass="min-w-[210px]"
            />
          </button>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
            Supported channels: card, bank transfer, USSD, and Apple Pay on Safari. {checkoutNote}
          </div>
        </div>

        <div className="section-frame rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <h2 className="text-xl font-semibold text-white">Need delivery clarity?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Shipping rules can be configured as flat fee, percentage of cart value, or waived after a free-shipping threshold in the secure admin portal.
          </p>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-400">Estimated total</p>
            <p className="truncate text-lg font-semibold text-white">{formatPrice(totalUsd)}</p>
          </div>
          <button
            type="button"
            onClick={beginCheckout}
            disabled={checkoutPending}
            className="inline-flex min-h-11 flex-[1.3] items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:opacity-70"
          >
            <LoadingInlineLabel
              loading={checkoutPending}
              idleLabel="Checkout"
              loadingLabel="Redirecting..."
              minWidthClass="min-w-[132px]"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
