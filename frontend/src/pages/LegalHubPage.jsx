import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { policyLinks } from "../data/storeData";

export function LegalHubPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Legal Hub</p>
        <h1 className="text-5xl font-semibold text-white">Policies built for premium electronics retail.</h1>
        <p className="text-base leading-8 text-slate-300">
          Review the operating policies that support SirDavid Gadgets, the premium consumer storefront of SIRDAVID MULTI-TRADE LTD.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {policyLinks.map((policy) => (
          <Link
            key={policy.key}
            to={policy.href}
            className="section-frame group rounded-[32px] p-6 transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Policy</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{policy.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Review how the storefront handles payments, privacy, refunds, logistics, and customer communication.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
              Read policy
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
