import { NavLink } from "react-router-dom";

import { policyContent, policyLinks } from "../data/storeData";

export function PolicyPage({ policyKey }) {
  const content = policyContent[policyKey];

  if (!content) {
    return null;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[0.75fr_1.25fr]">
      <aside className="section-frame h-fit rounded-[32px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{content.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">{content.intro}</p>
        <nav className="mt-8 space-y-2">
          {policyLinks.map((link) => (
            <NavLink
              key={link.key}
              to={link.href}
              className={({ isActive }) =>
                `block rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-white text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {link.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="space-y-5">
        {content.sections.map((section) => (
          <article key={section.heading} className="section-frame rounded-[32px] p-6">
            <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
            <p className="mt-4 text-sm leading-8 text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
