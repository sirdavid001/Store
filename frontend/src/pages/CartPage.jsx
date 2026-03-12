import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
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

function conditionClasses(condition) {
  const tones = {
    New: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    "Like New": "border border-blue-100 bg-blue-50 text-blue-700",
    Excellent: "border border-purple-100 bg-purple-50 text-purple-700",
    Good: "border border-amber-100 bg-amber-50 text-amber-700",
    Refurbished: "border border-orange-100 bg-orange-50 text-orange-700",
    Fair: "border border-gray-200 bg-gray-100 text-gray-600",
    "Certified Refurbished": "border border-orange-100 bg-orange-50 text-orange-700",
    "Open Box": "border border-blue-100 bg-blue-50 text-blue-700",
  };

  return tones[condition] || "border border-gray-200 bg-gray-100 text-gray-600";
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-6 py-4">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
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
    clearCart,
  } = useStore();
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
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

  const freeShippingGap =
    shippingConfig.mode === "free-threshold"
      ? Math.max(shippingConfig.freeThresholdUsd - subtotalUsd, 0)
      : 0;
  const freeShippingUnlocked =
    shippingConfig.mode === "free-threshold" ? freeShippingGap <= 0 : shippingUsd === 0;
  const freeShippingProgress =
    shippingConfig.mode === "free-threshold" && shippingConfig.freeThresholdUsd > 0
      ? Math.min((subtotalUsd / shippingConfig.freeThresholdUsd) * 100, 100)
      : freeShippingUnlocked
        ? 100
        : 0;

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
      <div className="bg-[#f8f9fc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-sm rounded-[32px] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-purple-50">
            <ShoppingBag className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your cart is empty.</h1>
          <p className="mt-3 text-sm text-gray-400">
            Add a premium device or accessory to begin checkout and continue to secure payment.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] pb-32 text-gray-900 lg:pb-16">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm text-gray-500 sm:px-6">
          <Link to="/shop" className="transition-colors hover:text-blue-600">
            Shop
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="font-medium text-gray-900">Cart</span>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ShoppingBag className="h-4 w-4" />
            Show order summary
          </span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900">{formatPrice(totalUsd)}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition ${mobileSummaryOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {mobileSummaryOpen ? (
          <div className="border-t border-gray-100 bg-gray-50 px-4 pb-5">
            <div className="space-y-3 pt-4">
              {cartLines.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl bg-gray-100">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(item.lineTotalUsd)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Your cart</h1>
              <p className="mt-1 text-sm text-gray-400">Review premium items before checkout.</p>
            </div>

            {shippingConfig.mode === "free-threshold" ? (
              freeShippingUnlocked ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-emerald-700">
                        Free shipping unlocked for this cart.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-700">
                        Add {formatPrice(freeShippingGap)} more to unlock free shipping.
                      </p>
                      <div className="mt-3 h-2 rounded-full bg-blue-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : null}

            <SectionCard icon={ShoppingBag} title="Cart items">
              <div className="space-y-5">
                {cartLines.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0 sm:flex-row"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-base font-semibold text-gray-900 transition-colors hover:text-blue-600"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-400">{item.brand}</span>
                        <span className={`rounded-full px-2 py-0.5 ${conditionClasses(item.condition)}`}>
                          {item.condition}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Unit price {formatPrice(item.priceUsd)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="inline-flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex h-8 w-8 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                      <p className="text-base font-bold text-gray-900">{formatPrice(item.lineTotalUsd)}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/shop"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                  ← Continue Shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>
            </SectionCard>

            <SectionCard icon={ShieldCheck} title="Customer details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <input
                    value={checkoutProfile.customer.firstName}
                    onChange={(event) => updateCustomerField("firstName", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={checkoutProfile.customer.lastName}
                    onChange={(event) => updateCustomerField("lastName", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={checkoutProfile.customer.email}
                    onChange={(event) => updateCustomerField("email", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    value={checkoutProfile.customer.phone}
                    onChange={(event) => updateCustomerField("phone", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard icon={Truck} title="Delivery details">
              <div className="grid gap-4">
                <Field label="Address line 1">
                  <input
                    value={checkoutProfile.address.addressLine1}
                    onChange={(event) => updateAddressField("addressLine1", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>

                <Field label="Address line 2">
                  <input
                    value={checkoutProfile.address.addressLine2}
                    onChange={(event) => updateAddressField("addressLine2", event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City">
                    <input
                      value={checkoutProfile.address.city}
                      onChange={(event) => updateAddressField("city", event.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </Field>
                  <Field label="State">
                    <input
                      value={checkoutProfile.address.state}
                      onChange={(event) => updateAddressField("state", event.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country">
                    <input
                      value={checkoutProfile.address.country}
                      onChange={(event) => updateAddressField("country", event.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </Field>
                  <Field label="Postal code">
                    <input
                      value={checkoutProfile.address.postalCode}
                      onChange={(event) => updateAddressField("postalCode", event.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </Field>
                </div>

                <Field label="Delivery instructions">
                  <textarea
                    rows={3}
                    value={checkoutProfile.address.deliveryInstructions}
                    onChange={(event) => updateAddressField("deliveryInstructions", event.target.value)}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </Field>

                <Field label="Payment method">
                  <SelectField
                    value={checkoutProfile.paymentMethod}
                    onValueChange={(value) =>
                      setCheckoutProfile((current) => ({ ...current, paymentMethod: value }))
                    }
                    options={paymentMethodOptions}
                    placeholder="Choose payment method"
                    triggerClassName="h-11 rounded-xl border-gray-200 bg-white text-sm text-gray-700"
                  />
                </Field>
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Order summary</h2>

              <div className="mt-5 space-y-3">
                {cartLines.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-gray-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(item.lineTotalUsd)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotalUsd)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingUsd === 0 ? "font-semibold text-emerald-600" : "font-medium text-gray-900"}>
                    {shippingUsd === 0 ? "FREE" : formatPrice(shippingUsd)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-blue-700">{formatPrice(totalUsd)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={beginCheckout}
                disabled={checkoutPending}
                className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-bold text-white transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LoadingInlineLabel
                  loading={checkoutPending}
                  idleLabel="Checkout with Paystack"
                  loadingLabel="Processing..."
                  minWidthClass="min-w-[210px]"
                />
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Lock className="h-3.5 w-3.5 text-gray-300" />
                Secured by Paystack
              </div>

              {currentCurrency !== settlementCurrency ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  {checkoutNote}
                </div>
              ) : (
                <p className="mt-4 text-xs text-gray-400">{checkoutNote}</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Estimated total</p>
            <p className="truncate text-lg font-extrabold text-gray-900">{formatPrice(totalUsd)}</p>
          </div>
          <button
            type="button"
            onClick={beginCheckout}
            disabled={checkoutPending}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60"
          >
            <LoadingInlineLabel
              loading={checkoutPending}
              idleLabel="Checkout"
              loadingLabel="Processing..."
              minWidthClass="min-w-[132px]"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
