import {
  ArrowRight,
  Banknote,
  CreditCard,
  MailCheck,
  ShieldCheck,
  Smartphone,
  Truck,
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

export function ShopPage() {
  const { products, formatPrice, currentCurrency, loadingRates } = useStore();
  const { routeLoading } = useLoadingUi();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "all";
  const condition = searchParams.get("condition") ?? "all";
  const sort = searchParams.get("sort") ?? "featured";
  const search = searchParams.get("search") ?? "";
  const deferredSearch = useDeferredValue(search);

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
  const showHeroSkeleton = loadingRates;
  const showCatalogSkeleton = loadingRates || routeLoading;

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
    <div className="space-y-16 pb-16 md:space-y-20">
      {showHeroSkeleton ? (
        <HeroSectionSkeleton />
      ) : (
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=80)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-blue-950/70" />

          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-24">
            <div className="fade-up order-1 max-w-3xl space-y-6 md:space-y-8">
              <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-sky-200 md:text-xs md:tracking-[0.35em]">
                <ShieldCheck className="h-4 w-4" />
                Premium electronics, verified payments
              </div>
              <div className="space-y-4 md:space-y-5">
                <h1 className="max-w-4xl text-3xl font-semibold leading-[0.98] text-white min-[390px]:text-4xl md:text-6xl lg:text-7xl">
                  Shop phones, laptops &amp; Apple Pay-ready electronics.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 min-[390px]:text-base md:text-lg md:leading-8">
                  SirDavid Gadgets is the premium online retail arm of SIRDAVID MULTI-TRADE LTD, built for clean merchandising, verified Paystack flows, and fast delivery across key African markets.
                </p>
              </div>

              <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:flex-wrap md:flex-row md:gap-4">
                <a
                  href="#catalog"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 min-[430px]:w-auto"
                >
                  Browse Products
                </a>
                <Link
                  to="/track-order"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 min-[430px]:w-auto"
                >
                  Track an Order
                </Link>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-slate-200 min-[360px]:grid-cols-2">
                {["Paystack Verified", "Apple Pay", "Fast Delivery", "Verified Domain"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-center"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-device relative order-2">
              <div className="section-frame rounded-[28px] p-3 min-[390px]:p-4 md:rounded-[32px] md:p-5">
                <div className="grid gap-4 rounded-[24px] bg-white p-4 text-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.32)] min-[390px]:p-5 md:rounded-[28px] md:p-5">
                  <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 md:text-xs md:tracking-[0.35em]">
                        Now displaying
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold min-[390px]:text-3xl">
                        {currentCurrency} storefront
                      </h2>
                    </div>
                    <span className="inline-flex min-h-11 items-center self-start rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-sm font-semibold text-white md:text-xs">
                      Premium Retail
                    </span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80"
                    alt="Premium electronics"
                    className="aspect-[4/3.1] w-full rounded-[22px] object-cover md:h-72 md:aspect-auto md:rounded-[24px]"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[22px] bg-slate-100 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 md:text-xs md:tracking-[0.3em]">
                        Flagship starting from
                      </p>
                      <p className="mt-2 text-2xl font-semibold md:text-3xl">{formatPrice(799)}</p>
                    </div>
                    <div className="rounded-[22px] bg-slate-950 p-4 text-white">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200 md:text-xs md:tracking-[0.3em]">
                        Webhook rule
                      </p>
                      <p className="mt-2 text-base font-semibold md:text-lg">
                        Orders are only confirmed after Paystack verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-violet-500/30 blur-3xl" />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl space-y-6 px-4 md:space-y-8 md:px-6">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300 md:text-xs md:tracking-[0.35em]">
              Shop by Department
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Curated electronics categories
            </h2>
          </div>
        </div>

        <div className="grid gap-4 min-[360px]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {departmentCards.map((department) => (
            <button
              key={department.id}
              type="button"
              onClick={() => {
                updateParam("category", department.id);
                scrollToCatalog();
              }}
              className="group relative min-h-11 overflow-hidden rounded-[24px] text-left transition hover:-translate-y-1 md:rounded-[32px]"
            >
              <img
                src={department.image}
                alt={department.label}
                className="aspect-[4/4.8] w-full object-cover transition duration-700 group-hover:scale-105 sm:aspect-[4/4.4] lg:h-80 lg:aspect-auto"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${department.accent}`} />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:space-y-3 sm:p-6">
                <span className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-black/25 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-white md:text-xs md:tracking-[0.28em]">
                  {department.label}
                </span>
                <h3 className="text-xl font-semibold text-white sm:text-2xl">{department.headline}</h3>
                <p className="text-sm leading-6 text-slate-100">{department.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 md:px-6">
        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          {paymentFeatures.map((feature, index) => {
            const icons = [CreditCard, Banknote, MailCheck];
            const Icon = icons[index];

            return (
              <article key={feature.title} className="section-frame rounded-[28px] p-6 text-center">
                <div className="inline-flex rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="catalog" className="bg-slate-50 py-16 text-slate-950 md:py-20">
        <div className="mx-auto max-w-7xl space-y-8 px-4 md:px-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 md:text-xs md:tracking-[0.35em]">
              Product Catalog
            </p>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="text-3xl font-semibold md:text-4xl">Verified devices and accessories</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base md:leading-8">
                  Filter across flagship phones, work-ready laptops, premium accessories, and portable tablets. Prices are shown in your selected currency and sourced from USD base pricing.
                </p>
              </div>
              <div className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
            <div className="flex min-w-max gap-3 rounded-[28px] border border-slate-200 bg-white p-3 md:grid md:min-w-0 md:grid-cols-4 md:gap-4 md:rounded-[32px] md:p-4">
              <div className="w-[220px] shrink-0 md:w-auto">
                <SelectField
                  value={category}
                  onValueChange={(value) => updateParam("category", value)}
                  options={[{ value: "all", label: "All Departments" }, ...departmentCards.map((item) => ({ value: item.id, label: item.label }))]}
                  placeholder="Category"
                  triggerClassName="min-h-11 border-slate-200 bg-slate-100 text-slate-900 data-[placeholder]:text-slate-500"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="w-[220px] shrink-0 md:w-auto">
                <SelectField
                  value={condition}
                  onValueChange={(value) => updateParam("condition", value)}
                  options={conditionOptions}
                  placeholder="Condition"
                  triggerClassName="min-h-11 border-slate-200 bg-slate-100 text-slate-900 data-[placeholder]:text-slate-500"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="w-[220px] shrink-0 md:w-auto">
                <SelectField
                  value={sort}
                  onValueChange={(value) => updateParam("sort", value)}
                  options={sortOptions}
                  placeholder="Sort"
                  triggerClassName="min-h-11 border-slate-200 bg-slate-100 text-slate-900 data-[placeholder]:text-slate-500"
                  contentClassName="min-w-[220px]"
                />
              </div>
              <div className="w-[260px] shrink-0 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600 md:w-auto">
                Live pricing displayed in <span className="font-semibold text-slate-950">{currentCurrency}</span>. Base product management still uses USD pricing.
              </div>
            </div>
          </div>

          {showCatalogSkeleton ? (
            <ProductGridSkeleton count={6} />
          ) : (
            <div className="grid gap-4 min-[360px]:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="section-frame overflow-hidden rounded-[36px]">
          <div className="grid gap-8 px-5 py-8 text-center lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12 lg:text-left">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300 md:text-xs md:tracking-[0.35em]">
                About the Brand
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-4xl">
                Built like a premium device shelf, backed by a Nigerian electronics business.
              </h2>
              <p className="max-w-2xl text-sm leading-8 text-slate-300">
                SirDavid Gadgets packages premium hardware, verified payments, and operations clarity into one storefront. Support, policies, and fulfillment messaging are designed to feel dependable for high-value electronics.
              </p>
              <a
                href="mailto:support@sirdavid.site"
                className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-sky-300 lg:justify-start"
              >
                support@sirdavid.site
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-3 min-[360px]:grid-cols-2">
              {[
                ["Paystack hosted checkout", "Verified references and logs"],
                ["Apple Pay ready", "Safari-compatible premium checkout"],
                ["Fast delivery lanes", "Priority routing for high-value orders"],
                ["Clear order messaging", "Only confirmed after webhook verification"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center lg:text-left">
                  <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-2 text-sky-300">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
