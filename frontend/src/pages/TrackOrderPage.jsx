import {
  AlertCircle,
  CheckCircle2,
  Copy,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { TrackOrderSkeleton } from "../components/AppLoading";
import { useStore } from "../context/StoreContext";
import { useLoadingUi } from "../context/LoadingUiContext";

function normalizeStatus(status) {
  return status.toLowerCase().replaceAll(" ", "_");
}

function statusStyles(status) {
  const tones = {
    delivered: {
      wrapper: "border-emerald-100 bg-emerald-50",
      iconWrap: "border-emerald-100 bg-white text-emerald-600",
      icon: CheckCircle2,
      title: "text-emerald-700",
    },
    in_transit: {
      wrapper: "border-purple-100 bg-purple-50",
      iconWrap: "border-purple-100 bg-white text-purple-600",
      icon: Truck,
      title: "text-purple-700",
    },
    processing: {
      wrapper: "border-blue-100 bg-blue-50",
      iconWrap: "border-blue-100 bg-white text-blue-600",
      icon: ShieldCheck,
      title: "text-blue-700",
    },
    paid: {
      wrapper: "border-blue-100 bg-blue-50",
      iconWrap: "border-blue-100 bg-white text-blue-600",
      icon: ShieldCheck,
      title: "text-blue-700",
    },
    cancelled: {
      wrapper: "border-red-100 bg-red-50",
      iconWrap: "border-red-100 bg-white text-red-500",
      icon: AlertCircle,
      title: "text-red-700",
    },
  };

  return tones[status] || tones.processing;
}

function CopyField({ label, value, copied, onCopy }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-mono text-sm font-semibold text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={`inline-flex rounded-xl border p-2 transition-all ${
          copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TrackOrderPage() {
  const { orders, formatPrice } = useStore();
  const { reducedMotion, routeLoading } = useLoadingUi();
  const [query, setQuery] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  async function handleLookup(event) {
    event.preventDefault();
    setLookupLoading(true);
    setLookupAttempted(true);

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

  async function copyValue(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(""), 1400);
    } catch {
      toast.error("Could not copy that value.");
    }
  }

  const normalizedStatus = activeOrder ? normalizeStatus(activeOrder.status) : "processing";
  const statusConfig = statusStyles(normalizedStatus);
  const progressWidth = useMemo(() => {
    if (!activeOrder) {
      return 0;
    }
    if (normalizedStatus === "delivered") {
      return 100;
    }
    if (normalizedStatus === "in_transit") {
      return 72;
    }
    if (normalizedStatus === "cancelled") {
      return 18;
    }
    return 38;
  }, [activeOrder, normalizedStatus]);

  return (
    <div className="bg-[#f8f9fc] pb-16 text-gray-900">
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 px-4 pb-20 pt-16 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex max-w-xl flex-col gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
              <PackageSearch className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Track your order</h1>
              <p className="mt-3 max-w-sm text-sm text-blue-200">
                Enter your order number, tracking reference, or checkout email to see the latest updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-6 rounded-[28px] border border-gray-100 bg-white p-6 shadow-xl">
          <form onSubmit={handleLookup}>
            <label className="text-sm font-semibold text-gray-700">Reference</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="SDG-2026-1042 or TRK-AX91-221"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 text-sm font-semibold text-white transition-all hover:shadow-md hover:shadow-blue-500/25"
              >
                <PackageSearch className="h-4 w-4" />
                Track Order
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Use your order number, tracking number, or checkout email.
            </p>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl space-y-6 px-4 sm:px-6">
        {lookupLoading || routeLoading ? (
          <TrackOrderSkeleton />
        ) : activeOrder ? (
          <>
            <div className={`rounded-[28px] border px-5 py-5 ${statusConfig.wrapper}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm ${statusConfig.iconWrap}`}>
                    <statusConfig.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                      Order status
                    </p>
                    <h2 className={`mt-1 text-2xl font-bold capitalize ${statusConfig.title}`}>
                      {activeOrder.status}
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{activeOrder.paymentStatus}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <CopyField
                    label="Order reference"
                    value={activeOrder.orderNumber}
                    copied={copiedField === "order"}
                    onCopy={() => copyValue("order", activeOrder.orderNumber)}
                  />
                  <CopyField
                    label="Tracking reference"
                    value={activeOrder.trackingNumber}
                    copied={copiedField === "tracking"}
                    onCopy={() => copyValue("tracking", activeOrder.trackingNumber)}
                  />
                </div>

                <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Progress timeline</h3>
                  </div>
                  <div className="px-6 py-6">
                    <div className="h-1.5 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          normalizedStatus === "delivered"
                            ? "bg-gradient-to-r from-emerald-500 to-green-500"
                            : "bg-gradient-to-r from-blue-500 to-purple-500"
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>

                    <div className="mt-8 space-y-5">
                      {activeOrder.timeline.map((entry, index) => {
                        const completed = index < activeOrder.timeline.length - 1 || normalizedStatus === "delivered";
                        const active = index === activeOrder.timeline.length - 1 && normalizedStatus !== "delivered";
                        return (
                          <div key={`${entry.title}-${entry.time}`} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                  completed
                                    ? "border-0 bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                                    : active
                                      ? "border-blue-500 bg-white text-blue-600 shadow-md"
                                      : "border-gray-200 bg-white text-gray-300"
                                }`}
                              >
                                <Truck className="h-4 w-4" />
                              </div>
                              {index < activeOrder.timeline.length - 1 ? (
                                <div className="mt-2 h-full w-px bg-gray-200" />
                              ) : null}
                            </div>
                            <div className="pb-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                                <span className="text-xs uppercase tracking-[0.15em] text-gray-400">
                                  {entry.time}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-gray-600">{entry.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        What happens next?
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        Continue monitoring this page for packaging, dispatch, and final delivery updates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Order items</h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="space-y-4">
                      {activeOrder.items.map((item) => (
                        <div key={item} className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item}</p>
                            <p className="text-sm text-gray-500">Premium electronics order item</p>
                          </div>
                          <p className="font-bold text-gray-900">
                            {formatPrice(activeOrder.amountUsd / Math.max(activeOrder.items.length, 1), activeOrder.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span className="font-semibold text-emerald-600">FREE</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-extrabold text-blue-700">
                        {formatPrice(activeOrder.amountUsd, activeOrder.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Customer details</h3>
                  </div>
                  <div className="space-y-4 px-6 py-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Customer</p>
                        <p className="text-sm font-medium text-gray-800">{activeOrder.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-medium text-gray-800">{activeOrder.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Payment</p>
                        <p className="text-sm font-medium text-gray-800">{activeOrder.paymentStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Delivery details</h3>
                  </div>
                  <div className="space-y-4 px-6 py-5">
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Tracking reference</p>
                        <p className="text-sm font-medium text-gray-800">{activeOrder.trackingNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Current stage</p>
                        <p className="text-sm font-medium capitalize text-gray-800">{activeOrder.status}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-4 w-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">Cart value</p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatPrice(activeOrder.amountUsd, activeOrder.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOrder(null);
                      setLookupAttempted(false);
                      setQuery("");
                    }}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    Track Another
                  </button>
                  <Link
                    to="/shop"
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-4">
                  <p className="text-sm font-semibold text-blue-900">Need more help?</p>
                  <p className="mt-1 text-xs text-blue-600">
                    Review the store policies or contact support for delivery-specific questions.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/faqs"
                      className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      FAQs
                    </Link>
                    <a
                      href="mailto:support@sirdavid.site"
                      className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : lookupAttempted ? (
          <div className="rounded-[28px] border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">No matching order was found.</h2>
            <p className="mt-2 text-sm text-gray-400">
              Check the reference and try again, or return to the catalog.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setLookupAttempted(false);
                  setQuery("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                Try Again
              </button>
              <Link
                to="/shop"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-medium text-white transition-all hover:shadow-md hover:shadow-blue-500/25"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <PackageSearch className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">Enter an order reference to begin.</h2>
            <p className="mt-2 text-sm text-gray-400">
              Use an order number, tracking number, or the checkout email used during purchase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
