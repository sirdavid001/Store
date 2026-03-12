import { ArrowLeft, ShieldCheck, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { LoadingInlineLabel } from "../components/AppLoading";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, formatPrice } = useStore();
  const [selectedImage, setSelectedImage] = useState("");
  const [activePanel, setActivePanel] = useState("specs");
  const [addingToCart, setAddingToCart] = useState(false);

  const product = products.find((item) => item.id === id);
  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Not found</p>
        <h1 className="text-4xl font-semibold text-white">We could not find that product.</h1>
        <Link
          to="/shop"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
        >
          Back to shop
        </Link>
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
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 pb-32 md:gap-16 md:px-6 md:py-16 md:pb-16">
      <Link to="/shop" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-300">
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="section-frame rounded-[28px] p-3 sm:rounded-[36px] sm:p-4">
          <img
            src={selectedImage || gallery[0]}
            alt={product.name}
            className="aspect-[4/4.4] w-full rounded-[24px] object-cover sm:aspect-[4/4.1] lg:h-[520px] lg:aspect-auto lg:rounded-[28px]"
          />
          <div className="-mx-1 mt-4 overflow-x-auto px-1 no-scrollbar">
            <div className="flex gap-3">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`shrink-0 overflow-hidden rounded-[20px] border-2 transition ${
                    selectedImage === image
                      ? "border-sky-400"
                      : "border-transparent hover:border-white/30"
                  }`}
                >
                  <img
                    src={image}
                    alt={product.name}
                    className="h-24 w-24 object-cover min-[390px]:h-28 min-[390px]:w-28 sm:h-32 sm:w-32"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-300 md:text-xs md:tracking-[0.3em]">
              <span>{product.brand}</span>
              <span className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white">
                {product.condition}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-white min-[390px]:text-4xl md:text-5xl">
              {product.name}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-lg md:leading-8">
              {product.description}
            </p>
            <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:flex-wrap min-[390px]:items-center">
              <p className="text-3xl font-semibold text-white md:text-4xl">
                {formatPrice(product.priceUsd)}
              </p>
              <span className="inline-flex min-h-11 items-center self-start rounded-full bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">
                {product.stock} units in stock
              </span>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:grid-cols-3 sm:p-6">
            {[
              [ShieldCheck, "Secure checkout", "Hosted payment flow with clean references and premium support"],
              [Truck, "Fast delivery", "Priority dispatch for premium electronics"],
              [Star, "Curated stock", "High-confidence inventory for serious buyers"],
            ].map(([Icon, title, text]) => (
              <div key={title} className="space-y-3 rounded-[24px] bg-black/20 p-4">
                <Icon className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:rounded-[30px] sm:p-6">
            <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
              <div className="flex gap-2">
                {[
                  { key: "specs", label: "Specifications" },
                  { key: "description", label: "Description" },
                  { key: "delivery", label: "Delivery" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePanel(tab.key)}
                    className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activePanel === tab.key
                        ? "bg-white text-slate-950"
                        : "border border-white/10 bg-white/6 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activePanel === "specs" ? (
              <div className="mt-5 grid gap-3">
                {product.specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between"
                  >
                    <span className="text-sm font-medium text-slate-400">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {activePanel === "description" ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
                {product.description}
              </div>
            ) : null}

            {activePanel === "delivery" ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:opacity-70"
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              <Zap className="h-4 w-4" />
              Buy Now
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Related picks</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Similar premium devices</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-400">From</p>
            <p className="truncate text-lg font-semibold text-white">{formatPrice(product.priceUsd)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-70"
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
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
