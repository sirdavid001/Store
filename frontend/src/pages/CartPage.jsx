import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useStore } from "../context/StoreContext";

export function CartPage() {
  const {
    cartLines,
    subtotalUsd,
    shippingUsd,
    totalUsd,
    shippingConfig,
    updateCartQuantity,
    removeFromCart,
    beginHostedCheckout,
    formatPrice,
  } = useStore();

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
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Cart</p>
          <h1 className="text-4xl font-semibold text-white">Your premium checkout shortlist</h1>
        </div>

        <div className="space-y-4">
          {cartLines.map((item) => (
            <article
              key={item.id}
              className="section-frame grid gap-4 rounded-[30px] p-4 sm:grid-cols-[140px_1fr_auto]"
            >
              <img src={item.image} alt={item.name} className="h-36 w-full rounded-[24px] object-cover" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">{item.brand}</p>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white">
                    {item.condition}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-white">{item.name}</h2>
                <p className="text-sm leading-7 text-slate-300">{item.shortDescription}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-4">
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <p className="text-2xl font-semibold text-white">{formatPrice(item.lineTotalUsd)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="section-frame rounded-[32px] p-6">
          <div className="flex items-center gap-3 rounded-[24px] bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
            Orders are only confirmed after Paystack webhook verification.
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

          <button
            type="button"
            onClick={beginHostedCheckout}
            className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            Checkout with Paystack
          </button>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
            Supported channels: card, bank transfer, USSD, and Apple Pay on Safari. Connect a secure backend initialization endpoint to launch the real hosted checkout flow.
          </div>
        </div>

        <div className="section-frame rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-white">Need delivery clarity?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Shipping rules can be configured as flat fee, percentage of cart value, or waived after a free-shipping threshold in the secure admin portal.
          </p>
        </div>
      </aside>
    </div>
  );
}
