import { PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TrackOrderSkeleton } from "../components/AppLoading";
import { useStore } from "../context/StoreContext";
import { useLoadingUi } from "../context/LoadingUiContext";

export function TrackOrderPage() {
  const { orders, formatPrice } = useStore();
  const { reducedMotion, routeLoading } = useLoadingUi();
  const [query, setQuery] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function handleLookup(event) {
    event.preventDefault();
    setLookupLoading(true);

    if (!reducedMotion) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 420);
      });
    }

    const term = query.trim().toLowerCase();
    const match = orders.find(
      (order) =>
        order.orderNumber.toLowerCase() === term ||
        order.trackingNumber.toLowerCase() === term ||
        order.email.toLowerCase() === term,
    );

    if (!match) {
      setActiveOrder(null);
      setLookupLoading(false);
      toast.error("No order matched that reference.");
      return;
    }

    setActiveOrder(match);
    setLookupLoading(false);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300 md:text-xs md:tracking-[0.35em]">
          Track Order
        </p>
        <h1 className="text-3xl font-semibold text-white min-[390px]:text-4xl md:text-5xl">
          Follow a verified delivery in real time.
        </h1>
        <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base md:leading-8">
          Enter your order number, tracking number, or checkout email. Only orders verified by Paystack webhook appear as confirmed shipments.
        </p>

        <form onSubmit={handleLookup} className="section-frame rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <label className="text-sm font-semibold text-white">Reference</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SDG-2026-1042 or TRK-AX91-221"
            className="mt-3 h-12 w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
          />
          <button
            type="submit"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 sm:w-auto"
          >
            <PackageSearch className="h-4 w-4" />
            Track Order
          </button>
        </form>

        <div className="section-frame rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <div className="flex items-center gap-3 text-sm text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
            Orders remain pending until payment verification succeeds.
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {lookupLoading || routeLoading ? (
          <TrackOrderSkeleton />
        ) : activeOrder ? (
          <>
            <div className="section-frame rounded-[32px] p-6">
              <div className="flex flex-col gap-4 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300 md:text-xs md:tracking-[0.3em]">
                    {activeOrder.orderNumber}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold capitalize text-white md:text-3xl">
                    {activeOrder.status}
                  </h2>
                </div>
                <span className="inline-flex min-h-11 items-center self-start rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                  {activeOrder.trackingNumber}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Customer</p>
                  <p className="mt-2 text-lg font-semibold text-white">{activeOrder.customer}</p>
                  <p className="text-sm text-slate-400">{activeOrder.email}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cart value</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatPrice(activeOrder.amountUsd, activeOrder.currency)}
                  </p>
                  <p className="text-sm text-slate-400">{activeOrder.paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="section-frame rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
              <h3 className="text-2xl font-semibold text-white">Order progress</h3>
              <div className="mt-6 space-y-4">
                {activeOrder.timeline.map((entry) => (
                  <div
                    key={`${entry.title}-${entry.time}`}
                    className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 sm:flex-row"
                  >
                    <div className="mt-1 inline-flex self-start rounded-full bg-sky-400/10 p-2 text-sky-300">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold text-white">{entry.title}</h4>
                        <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{entry.time}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="section-frame flex min-h-[420px] items-center justify-center rounded-[32px] p-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="mx-auto inline-flex rounded-full bg-white/6 p-4 text-sky-300">
                <PackageSearch className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-semibold text-white">Enter an order reference to begin.</h2>
              <p className="text-sm leading-7 text-slate-300">
                Use an order number, tracking number, or the customer email used at checkout. We only surface deliveries that have already passed payment verification.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
