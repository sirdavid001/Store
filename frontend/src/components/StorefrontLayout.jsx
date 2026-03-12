import { Globe2, Search, ShoppingBag, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { policyLinks } from "../data/storeData";
import { useStore } from "../context/StoreContext";
import { SelectField } from "./SelectField";

function HeaderLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-semibold transition ${
          isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/6 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function StorefrontLayout() {
  const { cartCount, currentCurrency, currencyOptions, setCurrency, loadingRates, lastRateSync } =
    useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("search") ?? "");
  }, [location.search]);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("search", query.trim());
    }
    navigate(`/shop${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="site-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 md:px-6">
          <NavLink to="/shop" className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-500 shadow-[0_0_32px_rgba(96,124,255,0.45)]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-lg font-semibold leading-none text-white">SirDavid</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-sky-300">
                Gadgets
              </p>
            </div>
          </NavLink>

          <form onSubmit={submitSearch} className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search phones, laptops, accessories..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400"
            />
          </form>

          <nav className="flex items-center gap-2">
            <HeaderLink to="/shop">Shop</HeaderLink>
            <HeaderLink to="/track-order">Track Order</HeaderLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-[128px] min-w-[128px] sm:w-[150px] sm:min-w-[150px]">
              <SelectField
                value={currentCurrency}
                onValueChange={setCurrency}
                options={currencyOptions}
                placeholder="Currency"
                triggerClassName="bg-white/5 py-2.5 text-xs"
              />
            </div>
            <NavLink
              to="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/20 hover:bg-white/10"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </NavLink>
          </div>
        </div>

        <div className="border-t border-white/6 bg-white/[0.02]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-xs text-slate-400 md:px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Paystack Verified
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1">
              <Truck className="h-3.5 w-3.5 text-sky-300" />
              Fast Delivery
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1">
              <Globe2 className="h-3.5 w-3.5 text-violet-300" />
              {loadingRates ? "Syncing rates..." : `Local currency: ${currentCurrency}`}
            </span>
            {lastRateSync ? (
              <span className="text-slate-500">
                Rates refreshed {new Date(lastRateSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:px-6">
          <section className="gradient-ring relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-600 to-violet-600 p-8 text-white">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">
                  Need a verified quote?
                </p>
                <h2 className="text-3xl font-semibold md:text-4xl">
                  Source premium electronics for your team, studio, or executive desk.
                </h2>
                <p className="text-sm leading-7 text-blue-50/90">
                  SirDavid Gadgets is the premium retail arm of SIRDAVID MULTI-TRADE LTD, built for verified payments and polished after-sales support.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <NavLink
                  to="/shop"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
                >
                  Browse Products
                </NavLink>
                <NavLink
                  to="/track-order"
                  className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Track an Order
                </NavLink>
              </div>
            </div>
          </section>

          <section className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
                SirDavid Gadgets
              </p>
              <h3 className="text-2xl font-semibold text-white">Premium electronics for modern living.</h3>
              <p className="max-w-md text-sm leading-7 text-slate-400">
                A dark, premium storefront for phones, laptops, tablets, and accessories with Paystack hosted checkout and webhook-first order verification.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Paystack</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Apple Pay</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Verified Domain</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Shop</p>
              <nav className="flex flex-col gap-3 text-sm text-slate-400">
                <NavLink to="/shop" className="hover:text-white">
                  All Products
                </NavLink>
                <NavLink to="/shop?category=phones" className="hover:text-white">
                  Phones
                </NavLink>
                <NavLink to="/shop?category=laptops" className="hover:text-white">
                  Laptops
                </NavLink>
                <NavLink to="/shop?category=tablets" className="hover:text-white">
                  Tablets
                </NavLink>
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Support</p>
              <nav className="flex flex-col gap-3 text-sm text-slate-400">
                <NavLink to="/track-order" className="hover:text-white">
                  Track Order
                </NavLink>
                <a href="mailto:support@sirdavid.site" className="hover:text-white">
                  support@sirdavid.site
                </a>
                <NavLink to="/faqs" className="hover:text-white">
                  FAQs
                </NavLink>
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Legal</p>
              <nav className="flex flex-col gap-3 text-sm text-slate-400">
                {policyLinks.map((policy) => (
                  <NavLink key={policy.key} to={policy.href} className="hover:text-white">
                    {policy.title}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Brand</p>
              <div className="space-y-3 text-sm leading-7 text-slate-400">
                <p>SIRDAVID MULTI-TRADE LTD</p>
                <p>Electronics retail, premium sourcing, verified fulfillment.</p>
                <NavLink to="/legal" className="text-sky-300 hover:text-white">
                  Legal hub
                </NavLink>
              </div>
            </div>
          </section>

          <div className="border-t border-white/10 pt-6 text-sm text-slate-500">
            © {new Date().getFullYear()} SirDavid Gadgets. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
