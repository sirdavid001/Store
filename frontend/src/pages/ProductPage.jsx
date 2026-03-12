import { ArrowLeft, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export function ProductPage() {
  const { id } = useParams();
  const { products, addToCart, formatPrice } = useStore();

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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 md:px-6">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="section-frame rounded-[36px] p-4">
          <img
            src={product.gallery?.[0] || product.image}
            alt={product.name}
            className="h-[520px] w-full rounded-[28px] object-cover"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(product.gallery ?? [product.image]).map((image) => (
              <img key={image} src={image} alt={product.name} className="h-40 w-full rounded-[24px] object-cover" />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
              <span>{product.brand}</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white">
                {product.condition}
              </span>
            </div>
            <h1 className="text-5xl font-semibold text-white">{product.name}</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">{product.description}</p>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-4xl font-semibold text-white">{formatPrice(product.priceUsd)}</p>
              <span className="rounded-full bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">
                {product.stock} units in stock
              </span>
            </div>
          </div>

          <div className="grid gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 sm:grid-cols-3">
            {[
              [ShieldCheck, "Verified checkout", "Paystack and webhook-first order confirmation"],
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

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Specifications</h2>
            <div className="mt-5 grid gap-3">
              {product.specs.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-6 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product.id)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
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
    </div>
  );
}
