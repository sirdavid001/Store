import {
  ArrowRight,
  Banknote,
  CreditCard,
  Filter,
  Globe2,
  Headphones,
  Laptop,
  MailCheck,
  ShieldCheck,
  Smartphone,
  Star,
  Tablet,
  Truck,
  Zap,
} from "lucide-react";
import { startTransition, useDeferredValue } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { HeroSectionSkeleton, ProductGridSkeleton } from "../components/AppLoading";
import { ProductCard } from "../components/ProductCard";
import { SelectField } from "../components/SelectField";
import { departmentCards, paymentFeatures } from "../data/storeData";
import { useStore } from "../context/StoreContext";
import { useLoadingUi } from "../context/LoadingUiContext";

const conditionOptions = [
  { value: "all", label: "All Conditions" },
  { value: "New", label: "New" },
  { value: "Certified Refurbished", label: "Certified Refurbished" },
  { value: "Open Box", label: "Open Box" },
];

const sortOptions = [
  { value: "featured", label: "Featured First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "stock", label: "Best Stock" },
];

const categoryIcons = {
  phones: Smartphone,
  laptops: Laptop,
  accessories: Headphones,
  tablets: Tablet,
};

export function ShopPage() {
  const { products, formatPrice, currentCurrency, loadingRates, currencyOptions } = useStore();
  const { routeLoading } = useLoadingUi();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "all";
  const condition = searchParams.get("condition") ?? "all";
  const sort = searchParams.get("sort") ?? "featured";
  const search = searchParams.get("search") ?? "";
  const deferredSearch = useDeferredValue(search);

  const currentCurrencyMeta =
    currencyOptions.find((option) => option.value === currentCurrency) ?? currencyOptions[0];

  const filteredProducts = products
    .filter((product) => (category === "all" ? true : product.category === category))
    .filter((product) => (condition === "all" ? true : product.condition === condition))
    .filter((product) => {
      const query = deferredSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }
      return `${product.name} ${product.brand} ${product.shortDescription}`
        .toLowerCase()
        .includes(query);
    })
    .sort((left, right) => {
      if (sort === "price-low") {
        return left.priceUsd - right.priceUsd;
      }
      if (sort === "price-high") {
        return right.priceUsd - left.priceUsd;
      }
      if (sort === "stock") {
        return right.stock - left.stock;
      }
      if (left.badge && !right.badge) {
        return -1;
      }
      if (!left.badge && right.badge) {
        return 1;
      }
      return left.name.localeCompare(right.name);
    });

  function scrollToCatalog() {
    window.requestAnimationFrame(() => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "featured") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    startTransition(() => {
      setSearchParams(next);
    });
  }

  return (
    <div className="bg-[#f8f9fc] text-gray-900">
      {loadingRates ? (
        <HeroSectionSkeleton />
      ) : (
        <section className="relative overflow-hidden bg-gray-950">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=80)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/40" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:min-h-[75vh] md:py-32 lg:flex lg:min-h-[85vh] lg:items-center">
            <div className="max-w-[640px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-gradient-to-r from-blue-500/15 to-purple-500/15 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Verified · Trusted · Secure checkout
              </div>

              <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                Shop phones, laptops &{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Apple Pay-ready
                </span>{" "}
                electronics.
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-400">
                SirDavid Gadgets is the premium online retail arm of SIRDAVID MULTI-TRADE LTD, built for polished merchandising, fast delivery, and clean secure payment flows.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#catalog"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-600/50"
                >
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/track-order"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 px-8 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Track an Order
                </Link>
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-md">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 text-sm text-gray-300 sm:px-6 md:grid-cols-4">
              {[
                [ShieldCheck, "Paystack Verified", "text-emerald-400"],
                [Zap, "Apple Pay", "text-amber-400"],
                [Truck, "Fast Delivery", "text-blue-400"],
                [Star, "Verified Domain", "text-purple-400"],
              ].map(([Icon, label, tone]) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${tone}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#f8f9fc] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                Shop by Department
              </p>
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
                Curated electronics categories
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                updateParam("category", "all");
                scrollToCatalog();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              View full catalog
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {departmentCards.map((department) => {
              const Icon = categoryIcons[department.id] || Smartphone;
              return (
                <button
                  key={department.id}
                  type="button"
                  onClick={() => {
                    updateParam("category", department.id);
                    scrollToCatalog();
                  }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-3xl text-left shadow-sm transition-all duration-500 hover:shadow-2xl"
                >
                  <img
                    src={department.image}
                    alt={department.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${department.accent} opacity-60 transition-opacity duration-300 group-hover:opacity-75`} />
                  <div className="absolute inset-0 rounded-3xl ring-2 ring-transparent transition group-hover:ring-white/20" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Icon className="mb-2 h-9 w-9 text-white drop-shadow-lg" />
                    <p className="text-xl font-bold text-white drop-shadow-lg">{department.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
              Payment Features
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Checkout built for confidence
            </h2>
            <p className="mt-4 text-base text-gray-500">
              Premium checkout experiences and polished customer communications, without changing the fast product flow.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {paymentFeatures.map((feature, index) => {
              const config = [
                {
                  Icon: CreditCard,
                  iconClassName: "bg-blue-50 text-blue-600",
                },
                {
                  Icon: Banknote,
                  iconClassName: "bg-purple-50 text-purple-600",
                },
                {
                  Icon: MailCheck,
                  iconClassName: "bg-green-50 text-green-600",
                },
              ][index];

              return (
                <article
                  key={feature.title}
                  className="group flex flex-col items-center rounded-3xl border border-gray-100 p-8 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconClassName}`}>
                    <config.Icon className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-[#f8f9fc] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-700">
                  Showing localized prices for{" "}
                  <span className="font-semibold text-blue-700">
                    {currentCurrencyMeta.country} ({currentCurrency})
                  </span>
                  .
                </p>
                <p className="mt-1 text-xs text-gray-400">Change currency in header</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
              Product Catalog
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Verified devices and accessories
            </h2>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
            <div className="flex min-w-max items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:min-w-0 md:flex-wrap">
              <div className="w-[210px]">
                <SelectField
                  value={category}
                  onValueChange={(value) => updateParam("category", value)}
                  options={[
                    { value: "all", label: "All Departments" },
                    ...departmentCards.map((item) => ({ value: item.id, label: item.label })),
                  ]}
                  placeholder="Category"
                  triggerClassName="h-10 border-gray-200 bg-gray-50 text-sm text-gray-700 hover:border-gray-300"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="w-[210px]">
                <SelectField
                  value={condition}
                  onValueChange={(value) => updateParam("condition", value)}
                  options={conditionOptions}
                  placeholder="Condition"
                  triggerClassName="h-10 border-gray-200 bg-gray-50 text-sm text-gray-700 hover:border-gray-300"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="w-[210px]">
                <SelectField
                  value={sort}
                  onValueChange={(value) => updateParam("sort", value)}
                  options={sortOptions}
                  placeholder="Sort"
                  triggerClassName="h-10 border-gray-200 bg-gray-50 text-sm text-gray-700 hover:border-gray-300"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-400">
                <Filter className="h-4 w-4 text-gray-300" />
                {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="mt-8">
            {loadingRates || routeLoading ? (
              <ProductGridSkeleton count={6} />
            ) : (
              <div className="grid gap-5 min-[360px]:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
              About the Brand
            </p>
            <h2 className="text-3xl font-bold text-white">
              Premium electronics with a sharp retail presence and dependable delivery.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
              SirDavid Gadgets packages premium hardware, clean pricing, and polished support into a storefront designed for confident buyers across key African markets.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Paystack Checkout", "Fast Fulfillment", "Verified Domain", "Apple Pay Ready"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-sm transition-colors hover:bg-white/12"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              ["Support", "support@sirdavid.site"],
              ["Coverage", "Phones, laptops, tablets, and accessories"],
              ["Operations", "Clean pricing, premium sourcing, and dependable order updates"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-4 border-b border-white/8 pb-4">
                <div className="w-28 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-600">
                  {label}
                </div>
                <div className="text-sm text-gray-300">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
