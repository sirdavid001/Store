import { ChevronDown, Globe2, Menu, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, X } from "lucide-react";
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
        `inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
          isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/6 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

const footerSections = [
  {
    key: "shop",
    title: "Shop",
    links: [
      { href: "/shop", label: "All Products" },
      { href: "/shop?category=phones", label: "Phones" },
      { href: "/shop?category=laptops", label: "Laptops" },
      { href: "/shop?category=tablets", label: "Tablets" },
    ],
  },
  {
    key: "support",
    title: "Support",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "mailto:support@sirdavid.site", label: "support@sirdavid.site" },
      { href: "/faqs", label: "FAQs" },
    ],
  },
  {
    key: "legal",
    title: "Legal",
    links: policyLinks.map((policy) => ({ href: policy.href, label: policy.title })),
  },
  {
    key: "brand",
    title: "Brand",
    links: [
      { href: "/legal", label: "Legal hub" },
      { href: "/shop", label: "Premium sourcing" },
      { href: "/track-order", label: "Verified fulfillment" },
    ],
  },
];

export function StorefrontLayout() {
  const { cartCount, currentCurrency, currencyOptions, setCurrency, loadingRates, lastRateSync } =
    useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openFooterSections, setOpenFooterSections] = useState({
    shop: true,
    support: false,
    legal: false,
    brand: false,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("search") ?? "");
  }, [location.search]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("search", query.trim());
    }
    navigate(`/shop${params.toString() ? `?${params}` : ""}`);
    setMobileSearchOpen(false);
  }

  function toggleFooterSection(key) {
    setOpenFooterSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <div className="site-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          <div className="flex h-14 items-center justify-between gap-2 md:h-auto md:flex-wrap md:gap-4 md:py-4">
            <NavLink to="/shop" className="flex min-w-0 items-center gap-2.5 md:gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-500 shadow-[0_0_32px_rgba(96,124,255,0.45)] md:h-11 md:w-11">
                <Sparkles className="h-4 w-4 text-white md:h-5 md:w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-none text-white md:text-lg">
                  SirDavid
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-sky-300 md:text-[10px] md:tracking-[0.38em]">
                  Gadgets
                </p>
              </div>
            </NavLink>

            <form onSubmit={submitSearch} className="relative hidden min-w-[240px] flex-1 md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search phones, laptops, accessories..."
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400"
              />
            </form>

            <nav className="hidden items-center gap-2 md:flex">
              <HeaderLink to="/shop">Shop</HeaderLink>
              <HeaderLink to="/track-order">Track Order</HeaderLink>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <div className="w-[128px] min-w-[128px] sm:w-[150px] sm:min-w-[150px]">
                <SelectField
                  value={currentCurrency}
                  onValueChange={setCurrency}
                  options={currencyOptions}
                  placeholder="Currency"
                  triggerClassName="min-h-11 bg-white/5 py-2.5 text-xs"
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

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/20 hover:bg-white/10"
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                aria-expanded={mobileSearchOpen}
              >
                {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              <NavLink
                to="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/20 hover:bg-white/10"
                aria-label="View cart"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/20 hover:bg-white/10"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-[max-height,opacity,padding] duration-300 md:hidden ${
              mobileSearchOpen ? "max-h-24 pb-3 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search phones, laptops, accessories..."
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400"
              />
            </form>
          </div>

          <div
            className={`overflow-hidden border-t border-white/10 transition-[max-height,opacity,padding] duration-300 md:hidden ${
              mobileMenuOpen ? "max-h-[420px] py-4 opacity-100" : "max-h-0 py-0 opacity-0"
            }`}
          >
            <div className="space-y-4">
              <nav className="grid gap-2">
                <HeaderLink to="/shop">Shop</HeaderLink>
                <HeaderLink to="/track-order">Track Order</HeaderLink>
                <HeaderLink to="/legal">Legal Hub</HeaderLink>
              </nav>
              <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                  Currency
                </p>
                <SelectField
                  value={currentCurrency}
                  onValueChange={setCurrency}
                  options={currencyOptions}
                  placeholder="Currency"
                  triggerClassName="min-h-11 bg-white/5 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-2 min-[360px]:grid-cols-2">
                <NavLink
                  to="/cart"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart ({cartCount})
                </NavLink>
                <a
                  href="mailto:support@sirdavid.site"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Support
                </a>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-white/6 bg-white/[0.02] md:block">
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
                  Rates refreshed{" "}
                  {new Date(lastRateSync).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:px-6">
          <section className="gradient-ring relative overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-white md:rounded-[32px] md:p-8">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">
                  Need a verified quote?
                </p>
                <h2 className="text-2xl font-semibold md:text-4xl">
                  Source premium electronics for your team, studio, or executive desk.
                </h2>
                <p className="text-sm leading-7 text-blue-50/90">
                  SirDavid Gadgets is the premium retail arm of SIRDAVID MULTI-TRADE LTD, built for verified payments and polished after-sales support.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <NavLink
                  to="/shop"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 sm:w-auto"
                >
                  Browse Products
                </NavLink>
                <NavLink
                  to="/track-order"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Track an Order
                </NavLink>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-[1.5fr_repeat(4,1fr)] md:gap-10">
            <div className="space-y-4 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
                SirDavid Gadgets
              </p>
              <h3 className="text-2xl font-semibold text-white">Premium electronics for modern living.</h3>
              <p className="max-w-md text-sm leading-7 text-slate-400">
                A dark, premium storefront for phones, laptops, tablets, and accessories with Paystack hosted checkout and polished order updates.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-200 md:justify-start">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Paystack</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Apple Pay</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Verified Domain</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Fast Delivery</span>
              </div>
            </div>

            {footerSections.map((section) => (
              <div
                key={section.key}
                className="border-t border-white/10 pt-4 md:border-t-0 md:pt-0"
              >
                <button
                  type="button"
                  onClick={() => toggleFooterSection(section.key)}
                  className="flex min-h-11 w-full items-center justify-between text-left md:pointer-events-none"
                >
                  <span className="text-sm font-semibold text-white">{section.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition md:hidden ${
                      openFooterSections[section.key] ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <nav
                  className={`${
                    openFooterSections[section.key] ? "mt-3 flex" : "hidden"
                  } flex-col gap-3 text-sm text-slate-400 md:mt-4 md:flex`}
                >
                  {section.links.map((link) =>
                    link.href.startsWith("mailto:") ? (
                      <a key={link.label} href={link.href} className="hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <NavLink key={link.label} to={link.href} className="hover:text-white">
                        {link.label}
                      </NavLink>
                    ),
                  )}
                </nav>
              </div>
            ))}
          </section>

          <div className="border-t border-white/10 pt-6 text-center text-sm text-slate-500 md:text-left">
            © {new Date().getFullYear()} SirDavid Gadgets. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
