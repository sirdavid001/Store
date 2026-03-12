import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Sparkles } from "lucide-react";

const splashParticles = [
  { left: 8, size: 6, duration: 12, delay: 0.2 },
  { left: 16, size: 8, duration: 11, delay: 1.2 },
  { left: 24, size: 4, duration: 13, delay: 0.6 },
  { left: 35, size: 7, duration: 10, delay: 1.8 },
  { left: 44, size: 5, duration: 14, delay: 0.4 },
  { left: 56, size: 8, duration: 12, delay: 1.4 },
  { left: 64, size: 4, duration: 9, delay: 0.9 },
  { left: 72, size: 7, duration: 11, delay: 0.1 },
  { left: 82, size: 5, duration: 13, delay: 1.6 },
  { left: 90, size: 6, duration: 10, delay: 0.7 },
];

function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-[24px] ${className}`} />;
}

export function RouteLoadingBar({ progress, visible }) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-1 bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500 shadow-[0_0_24px_rgba(96,124,255,0.65)]"
            animate={{ width: `${progress}%` }}
            initial={{ width: "0%" }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: "easeInOut" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SplashScreen({ visible }) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-[#0f0f1a]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 1.05,
            transition: { duration: reducedMotion ? 0.1 : 0.4, ease: "easeOut" },
          }}
        >
          <div className="absolute inset-0">
            {splashParticles.map((particle, index) => (
              <motion.span
                key={`${particle.left}-${index}`}
                className="absolute rounded-full bg-white/50 shadow-[0_0_18px_rgba(129,140,248,0.4)]"
                style={{
                  left: `${particle.left}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={
                  reducedMotion
                    ? { opacity: 0.45, y: 0 }
                    : {
                        opacity: [0.18, 0.85, 0.2],
                        y: [120, -220],
                      }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.1 }
                    : {
                        duration: particle.duration,
                        delay: particle.delay,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
              />
            ))}
          </div>

          <div className="relative flex min-h-screen items-center justify-center px-6">
            <motion.div
              className="mx-auto flex w-full max-w-xl flex-col items-center text-center"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.1 : 0.45, ease: "easeOut" }}
            >
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-blue-500 via-sky-500 to-violet-500 shadow-[0_0_60px_rgba(96,124,255,0.45)]"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        scale: [1, 1.04, 1],
                        boxShadow: [
                          "0 0 40px rgba(96,124,255,0.35)",
                          "0 0 72px rgba(96,124,255,0.6)",
                          "0 0 40px rgba(96,124,255,0.35)",
                        ],
                      }
                }
                transition={{ duration: 2.2, repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY }}
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>

              <div className="mt-8 space-y-2">
                <p className="font-['Sora'] text-4xl font-semibold text-white md:text-5xl">
                  SirDavid
                </p>
                <p className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-semibold uppercase tracking-[0.42em] text-transparent md:text-base">
                  Gadgets
                </p>
              </div>

              <div className="mt-8 w-full max-w-sm overflow-hidden rounded-full bg-white/10 p-1">
                <motion.div
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: reducedMotion ? 0.12 : 2.1, ease: "easeInOut" }}
                />
              </div>

              <motion.p
                className="mt-5 text-sm text-slate-300 md:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.45, delay: reducedMotion ? 0 : 0.75 }}
              >
                Premium Electronics · Fast Delivery · Secure Checkout
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PageSpinner({ fullScreen = false }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={`flex items-center justify-center px-6 py-16 ${
        fullScreen ? "min-h-screen bg-[#f8f9fc]" : "min-h-[40vh]"
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`brand-spinner h-12 w-12 rounded-full border border-gray-200 ${
            reducedMotion ? "" : "animate-spin"
          }`}
        />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}

export function HeroSectionSkeleton() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-blue-950/70" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-24">
        <div className="space-y-6">
          <SkeletonBlock className="h-11 w-56 bg-white/10" />
          <div className="space-y-3">
            <SkeletonBlock className="h-12 w-full max-w-2xl bg-white/10" />
            <SkeletonBlock className="h-12 w-5/6 max-w-xl bg-white/10" />
            <SkeletonBlock className="h-6 w-full max-w-2xl bg-white/10" />
            <SkeletonBlock className="h-6 w-4/5 max-w-xl bg-white/10" />
          </div>
          <div className="grid gap-3 min-[430px]:grid-cols-2">
            <SkeletonBlock className="h-11 bg-white/10" />
            <SkeletonBlock className="h-11 bg-white/10" />
          </div>
          <div className="grid gap-3 min-[360px]:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={`hero-badge-${index}`} className="h-11 bg-white/10" />
            ))}
          </div>
        </div>

        <div className="section-frame rounded-[28px] p-3 min-[390px]:p-4 md:rounded-[32px] md:p-5">
          <div className="grid gap-4 rounded-[24px] bg-white p-4 min-[390px]:p-5 md:rounded-[28px] md:p-5">
            <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-8 w-48" />
              </div>
              <SkeletonBlock className="h-11 w-36" />
            </div>
            <SkeletonBlock className="aspect-[4/3.1] w-full md:h-72 md:aspect-auto" />
            <div className="grid gap-3 md:grid-cols-2">
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 min-[360px]:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`product-skeleton-${index}`}
          className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(2,6,23,0.08)] sm:rounded-[28px] sm:p-4"
        >
          <SkeletonBlock className="aspect-[4/4.6] w-full sm:aspect-[4/4.8]" />
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-7 w-4/5" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-2/3" />
            <div className="pt-2">
              <SkeletonBlock className="h-6 w-32" />
            </div>
            <SkeletonBlock className="h-11 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function TrackOrderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-10 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
      </div>
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
        <SkeletonBlock className="h-8 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`timeline-skeleton-${index}`}
              className="flex flex-col gap-4 rounded-[24px] border border-gray-100 bg-gray-50 p-4 sm:flex-row"
            >
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingInlineLabel({ loading, idleLabel, loadingLabel, minWidthClass = "min-w-[140px]" }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${minWidthClass}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span>{loading ? loadingLabel : idleLabel}</span>
    </span>
  );
}
