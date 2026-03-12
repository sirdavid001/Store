import {
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { LoadingInlineLabel, PageSpinner } from "../components/AppLoading";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

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

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, productsLoading, addToCart, formatPrice } = useStore();
  const [selectedImage, setSelectedImage] = useState("");
  const [activePanel, setActivePanel] = useState("specs");
  const [addingToCart, setAddingToCart] = useState(false);

  const product = products.find((item) => item.id === id);
  if (productsLoading && !product) {
    return <PageSpinner />;
  }

  if (!product) {
    return (
      <div className="bg-[#f8f9fc] px-4 py-20 text-center sm:px-6">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-gray-100 bg-white p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Not found</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
            We could not find that product.
          </h1>
          <Link
            to="/shop"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);
  const gallery = product.gallery?.length ? product.gallery : [product.image];

  useEffect(() => {
    setSelectedImage(gallery[0]);
    setActivePanel("specs");
    setAddingToCart(false);
  }, [product.id]);

  function handleBuyNow() {
    addToCart(product.id);
    navigate("/cart");
  }

  function handleAddToCart() {
    setAddingToCart(true);
    addToCart(product.id);
    window.setTimeout(() => {
      setAddingToCart(false);
    }, 280);
  }

  return (
    <div className="bg-[#f8f9fc] pb-32 text-gray-900 md:pb-16">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm text-gray-500 sm:px-6">
          <Link to="/shop" className="transition-colors hover:text-blue-600">
            Shop
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="capitalize transition-colors hover:text-blue-600">{product.category}</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="font-medium text-gray-900">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        <Link
          to="/shop"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="space-y-4">
            <div className="group relative aspect-square overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
              <img
                src={selectedImage || gallery[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {gallery.findIndex((image) => image === (selectedImage || gallery[0])) + 1} / {gallery.length}
              </span>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
              <div className="flex gap-3">
                {gallery.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === image || (!selectedImage && image === gallery[0])
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={image} alt={product.name} className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [ShieldCheck, "Secure checkout", "Protected payment handoff"],
                [Truck, "Fast delivery", "Priority premium dispatch"],
                [Star, "Curated stock", "High-confidence inventory"],
              ].map(([Icon, title, text]) => (
                <div
                  key={title}
                  className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm"
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-xs font-semibold text-gray-800">{title}</p>
                  <p className="mt-1 text-xs text-gray-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {product.brand}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 capitalize">
                {product.category}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${conditionClasses(product.condition)}`}>
                {product.condition}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-1 text-sm text-gray-400">{product.brand} premium device</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <p className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-4xl font-extrabold text-transparent">
                  {formatPrice(product.priceUsd)}
                </p>
                <span className="text-sm text-gray-400">USD base pricing with local currency display</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {product.specs.slice(0, 4).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm"
                >
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.specs.map(([label, value]) => (
                <span key={`${label}-${value}`} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {label}: {value}
                </span>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
                <div className="inline-flex rounded-2xl bg-gray-100 p-1">
                  {[
                    { key: "specs", label: "Specifications" },
                    { key: "description", label: "Details" },
                    { key: "delivery", label: "Delivery" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActivePanel(tab.key)}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        activePanel === tab.key
                          ? "bg-white font-semibold text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {activePanel === "specs" ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {product.specs.map(([label, value], index) => (
                    <div
                      key={label}
                      className={`grid gap-2 px-4 py-3 sm:grid-cols-[180px_1fr] ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activePanel === "description" ? (
                <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm">
                  {product.description}
                </div>
              ) : null}

              {activePanel === "delivery" ? (
                <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm">
                  Premium devices move into dispatch after checkout processing is completed, and
                  you can continue follow-up from the order tracking page.
                </div>
              ) : null}
            </div>

            <div className="hidden gap-3 md:flex">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="inline-flex h-13 min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-70"
              >
                {addingToCart ? null : <ShoppingCart className="h-4 w-4" />}
                <LoadingInlineLabel
                  loading={addingToCart}
                  idleLabel="Add to Cart"
                  loadingLabel="Adding..."
                  minWidthClass="min-w-[126px]"
                />
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex h-13 min-h-11 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 text-sm font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </button>
            </div>
          </div>
        </section>

        <section className="mt-20 border-t border-gray-200 pt-16">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Similar premium devices
            </h2>
            <p className="mt-1 text-sm text-gray-400">More picks from the same category.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">From</p>
            <p className="truncate text-lg font-extrabold text-gray-900">{formatPrice(product.priceUsd)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-70"
          >
            {addingToCart ? null : <ShoppingCart className="h-4 w-4" />}
            <LoadingInlineLabel
              loading={addingToCart}
              idleLabel="Add to Cart"
              loadingLabel="Adding..."
              minWidthClass="min-w-[120px]"
            />
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
