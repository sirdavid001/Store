import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { policyLinks } from "../data/storeData";

export function LegalHubPage() {
  return (
    <div className="bg-[#f8f9fc] px-4 py-16 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Legal Hub</p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
            Policies built for premium electronics retail.
          </h1>
          <p className="mt-4 text-base leading-8 text-gray-500">
            Review the operating policies that support SirDavid Gadgets, the premium consumer storefront of SIRDAVID MULTI-TRADE LTD.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {policyLinks.map((policy) => (
            <Link
              key={policy.key}
              to={policy.href}
              className="group rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Policy</p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">{policy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-500">
                Review how the storefront handles payments, privacy, refunds, logistics, and customer communication.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Read policy
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
