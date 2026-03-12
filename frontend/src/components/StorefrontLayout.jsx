import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Mail,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
  Zap,
} from "lucide-react";
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
        `inline-flex min-h-11 w-full items-center justify-start rounded-lg px-3 py-1.5 text-sm transition-colors md:w-auto md:justify-center ${
          isActive
            ? "bg-blue-50 font-semibold text-blue-600"
            : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
];

export function StorefrontLayout() {
  const { cartCount, currentCurrency, currencyOptions, setCurrency } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openFooterSections, setOpenFooterSections] = useState({
    shop: true,
    support: false,
    legal: false,
  });

  const isShopPage = location.pathname === "/" || location.pathname === "/shop";

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
    setMobileMenuOpen(false);
  }

  function toggleFooterSection(key) {
    setOpenFooterSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <div className="site-shell min-h-screen bg-[#f8f9fc] text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <NavLink to="/shop" className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-md">
                  <Package className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold tracking-tight text-gray-900 sm:text-lg">
                    SirDavid
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Gadgets
                  </p>
                </div>
              </NavLink>

              {isShopPage ? (
                <form onSubmit={submitSearch} className="relative hidden flex-1 md:block md:max-w-md md:mx-8">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products, brands, or models"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                  />
                </form>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <nav className="flex items-center gap-1">
                <HeaderLink to="/shop">Shop</HeaderLink>
                <HeaderLink to="/track-order">Track Order</HeaderLink>
              </nav>

              <div className="w-[124px]">
                <SelectField
                  value={currentCurrency}
                  onValueChange={setCurrency}
                  options={currencyOptions}
                  placeholder="Currency"
                  triggerClassName="h-10 rounded-xl border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300"
                />
              </div>

              <NavLink
                to="/cart"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-semibold text-white transition-all hover:shadow-md hover:shadow-blue-500/25"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-blue-600">
                  {cartCount}
                </span>
              </NavLink>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100"
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              >
                {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              <NavLink
                to="/cart"
                className="relative inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 text-white shadow-sm"
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-blue-600">
                  {cartCount}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-[max-height,opacity,padding] duration-300 md:hidden ${
              mobileSearchOpen ? "max-h-24 pb-4 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, brands, or models"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </form>
          </div>

          <div
            className={`overflow-hidden transition-[max-height,opacity,padding] duration-300 md:hidden ${
              mobileMenuOpen ? "max-h-[420px] py-4 opacity-100" : "max-h-0 py-0 opacity-0"
            }`}
          >
            <div className="space-y-3 border-t border-gray-100 px-0 pt-4">
              <form onSubmit={submitSearch} className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, brands, or models"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                />
              </form>

              <nav className="grid gap-2">
                <HeaderLink to="/shop">Shop</HeaderLink>
                <HeaderLink to="/track-order">Track Order</HeaderLink>
                <HeaderLink to="/legal">Legal Hub</HeaderLink>
              </nav>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <Globe2 className="h-3.5 w-3.5 text-blue-500" />
                  Currency
                </div>
                <SelectField
                  value={currentCurrency}
                  onValueChange={setCurrency}
                  options={currencyOptions}
                  placeholder="Currency"
                  triggerClassName="h-11 rounded-xl border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-[#f8f9fc]">
        <Outlet />
      </main>

      <footer className="border-t border-white/8 bg-[#0a0d14]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <section className="rounded-[32px] bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white shadow-[0_30px_80px_rgba(79,70,229,0.3)] md:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold md:text-2xl">
                  Need a verified quote for your team, studio, or executive desk?
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Source premium electronics through SirDavid Gadgets with polished support and fast order follow-up.
                </p>
              </div>
              <NavLink
                to="/shop"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </section>

          <div className="mt-14 grid gap-10 md:grid-cols-[1.25fr_repeat(3,1fr)]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-md">
                  <Package className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-base font-extrabold tracking-tight text-white">SirDavid</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Gadgets
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-7 text-gray-500">
                Premium electronics and gadgets for modern living, curated for buyers who want clean pricing, reliable stock, and a polished checkout flow.
              </p>
              <a
                href="mailto:support@sirdavid.site"
                className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                support@sirdavid.site
              </a>
              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-300">
                  Brand
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  <NavLink to="/legal" className="text-gray-500 transition-colors hover:text-gray-300">
                    Legal hub
                  </NavLink>
                  <NavLink to="/shop" className="text-gray-500 transition-colors hover:text-gray-300">
                    Premium sourcing
                  </NavLink>
                  <NavLink to="/track-order" className="text-gray-500 transition-colors hover:text-gray-300">
                    Verified fulfillment
                  </NavLink>
                </div>
              </div>
            </div>

            {footerSections.map((section) => (
              <div key={section.key} className="border-t border-white/8 pt-4 md:border-t-0 md:pt-0">
                <button
                  type="button"
                  onClick={() => toggleFooterSection(section.key)}
                  className="flex min-h-11 w-full items-center justify-between text-left md:pointer-events-none"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-300">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition md:hidden ${
                      openFooterSections[section.key] ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <nav
                  className={`${
                    openFooterSections[section.key] ? "mt-4 flex" : "hidden"
                  } flex-col gap-3 text-sm md:mt-5 md:flex`}
                >
                  {section.links.map((link) =>
                    link.href.startsWith("mailto:") ? (
                      <a key={link.label} href={link.href} className="text-gray-500 transition-colors hover:text-gray-300">
                        {link.label}
                      </a>
                    ) : (
                      <NavLink key={link.label} to={link.href} className="text-gray-500 transition-colors hover:text-gray-300">
                        {link.label}
                      </NavLink>
                    ),
                  )}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} SirDavid Gadgets. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Paystack Verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Apple Pay Ready
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-blue-400" />
                Fast Delivery
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
