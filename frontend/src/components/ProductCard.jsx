import { ShoppingCart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { useStore } from "../context/StoreContext";

export function ProductCard({ product }) {
  const { addToCart, formatPrice } = useStore();

  return (
    <article className="white-product-card gradient-ring relative flex h-full flex-col overflow-hidden rounded-[28px] p-4">
      <div className="relative overflow-hidden rounded-[24px] bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white">
          {product.condition}
        </span>
        {product.badge ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-1 pb-2 pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              {product.brand}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {product.category}
            </p>
          </div>
          <Link
            to={`/product/${product.id}`}
            className="block text-2xl font-semibold leading-tight text-slate-950 transition hover:text-blue-700"
          >
            {product.name}
          </Link>
          <p className="text-sm leading-6 text-slate-600">{product.shortDescription}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">From</p>
            <p className="text-2xl font-semibold text-slate-950">{formatPrice(product.priceUsd)}</p>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product.id)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
