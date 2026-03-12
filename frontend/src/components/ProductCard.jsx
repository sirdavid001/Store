import { Eye, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { LoadingInlineLabel } from "./AppLoading";
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-gray-100 bg-white transition-all duration-300 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/80">
      <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-gray-50 to-gray-100">
        <Link to={`/product/${product.id}`} className="block">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
        </Link>

        <Link
          to={`/product/${product.id}`}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-gray-700 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white group-hover:opacity-100"
          aria-label={`View ${product.name}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {product.brand}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${conditionClasses(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-3 min-h-[3rem] text-base font-bold text-gray-900 transition-colors hover:text-blue-600"
        >
          {product.name}
        </Link>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {product.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.specs?.slice(0, 3).map(([label, value]) => (
            <span
              key={`${product.id}-${label}`}
              className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-500"
            >
              {label}: {value}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-gray-900">
              {formatPrice(product.priceUsd)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md hover:shadow-blue-500/25 disabled:opacity-70"
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
    </article>
  );
}
