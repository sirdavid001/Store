import { ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

import { policyContent, policyLinks } from "../data/storeData";

export function PolicyPage({ policyKey }) {
  const content = policyContent[policyKey];

  if (!content) {
    return null;
  }

  return (
    <div className="bg-[#f8f9fc] pb-16 text-gray-900">
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 px-4 py-16 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{content.title}</h1>
          <p className="mt-3 text-sm text-blue-200">{content.intro}</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-6 max-w-3xl px-4 sm:px-6">
        <div className="rounded-[28px] border border-gray-100 bg-white px-8 py-10 shadow-sm">
          <nav className="mb-8 flex flex-wrap gap-2 border-b border-gray-100 pb-6">
            {policyLinks.map((link) => (
              <NavLink
                key={link.key}
                to={link.href}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {link.title}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-8">
            {content.sections.map((section, index) => (
              <article
                key={section.heading}
                className={index === content.sections.length - 1 ? "" : "border-b border-gray-100 pb-8"}
              >
                <h2 className="text-xl font-bold text-gray-900">{section.heading}</h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
