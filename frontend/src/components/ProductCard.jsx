import { useState } from "react";
import { ShoppingCart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { LoadingInlineLabel } from "./AppLoading";
import { useStore } from "../context/StoreContext";

export function ProductCard({ product }) {
  const { addToCart, formatPrice } = useStore();
  const [adding, setAdding] = useState(false);

  function handleAddToCart() {
    setAdding(true);
    addToCart(product.id);
    window.setTimeout(() => {
      setAdding(false);
    }, 280);
  }

  return (
    <article className="white-product-card gradient-ring relative flex h-full flex-col overflow-hidden rounded-[24px] p-3 sm:rounded-[28px] sm:p-4">
      <div className="relative overflow-hidden rounded-[20px] bg-slate-100 sm:rounded-[24px]">
        <img
          src={product.image}
          alt={product.name}
          className="aspect-[4/4.6] w-full object-cover transition duration-500 hover:scale-105 min-[360px]:aspect-[4/4.8] sm:aspect-[4/4.6]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/90 px-3 py-1 text-[13px] font-semibold text-white sm:left-4 sm:top-4">
          {product.condition}
        </span>
        {product.badge ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-[13px] font-semibold text-white sm:right-4 sm:top-4">
            <Sparkles className="h-3.5 w-3.5" />
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-1 pb-2 pt-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:text-sm sm:tracking-[0.22em]">
              {product.brand}
            </p>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-sm sm:tracking-[0.22em]">
              {product.category}
            </p>
          </div>
          <Link
            to={`/product/${product.id}`}
            className="block text-xl font-semibold leading-tight text-slate-950 transition hover:text-blue-700 sm:text-2xl"
          >
            {product.name}
          </Link>
          <p className="text-sm leading-6 text-slate-600">{product.shortDescription}</p>
        </div>

        <div className="mt-auto flex flex-col gap-4 min-[360px]:gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs sm:tracking-[0.25em]">
                From
              </p>
              <p className="text-2xl font-semibold text-slate-950">{formatPrice(product.priceUsd)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {adding ? null : <ShoppingCart className="h-4 w-4" />}
            <LoadingInlineLabel
              loading={adding}
              idleLabel="Add to Cart"
              loadingLabel="Adding..."
              minWidthClass="min-w-[126px]"
            />
          </button>
        </div>
      </div>
    </article>
  );
}
