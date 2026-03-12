import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  AdminApiError,
  getStoredAdminToken,
  isAdminApiConfigured,
  loginAdmin,
  setStoredAdminToken,
  setupAdminFirstTime,
} from "../app/lib/api";

function Field({ label, children, hint = "" }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    />
  );
}

export function AdminSetupFirstTimePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "setup";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitSetup(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        mode,
      };
      const result = await setupAdminFirstTime(payload);
      const token =
        result?.adminToken || result?.token || result?.data?.adminToken || result?.data?.token;

      if (token) {
        setStoredAdminToken(String(token));
      } else if (!getStoredAdminToken()) {
        const session = await loginAdmin({ email: form.email.trim(), password: form.password });
        setStoredAdminToken(session.token);
      }

      toast.success(mode === "reset" ? "Admin access reset." : "Admin setup complete.");
      navigate("/secure-admin-portal-xyz", { replace: true });
    } catch (setupError) {
      const apiError =
        setupError instanceof AdminApiError
          ? setupError
          : new AdminApiError(setupError.message || "Could not complete setup.");
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(74,123,255,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#07101f_0%,#040816_48%,#02040d_100%)] px-4 py-12 text-white md:px-6">
      <div className="mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-center gap-8 md:grid md:grid-cols-[1fr_520px]">
        <section className="rounded-[36px] border border-white/10 bg-white/8 p-8 shadow-[0_32px_120px_rgba(2,6,23,0.45)] backdrop-blur md:p-12">
          <div className="inline-flex items-center gap-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_18px_40px_rgba(74,123,255,0.3)]">
              <Shield className="h-7 w-7 text-white" />
            </span>
            <div>
              <p className="font-['Sora'] text-2xl font-semibold">SirDavid</p>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                Admin Setup
              </p>
            </div>
          </div>

          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
            {mode === "reset" ? "Reset operator access" : "First-time provisioning"}
          </p>
          <h1 className="mt-4 max-w-xl font-['Sora'] text-4xl font-semibold leading-[1.02] md:text-6xl">
            {mode === "reset"
              ? "Restore access to the hidden admin route."
              : "Create the first admin account for SirDavid Gadgets."}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            {mode === "reset"
              ? "Use this page when the backend returns wrong-password or setup-incomplete errors. Once this completes, you can return directly to the hidden admin portal."
              : "Provision the first operator account for orders, products, shipping, and debugging. The backend should return an admin token immediately after setup."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Hidden route: /secure-admin-portal-xyz
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              X-Admin-Token flow
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Supabase edge backend
            </span>
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-200 bg-white p-8 text-slate-950 shadow-[0_24px_90px_rgba(15,23,42,0.18)] md:p-9">
          <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
            {mode === "reset" ? "Reset" : "Setup"}
          </p>
          <h2 className="mt-3 font-['Sora'] text-3xl font-semibold text-slate-950">
            {mode === "reset" ? "Reset admin credentials" : "Configure admin access"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use the same email you will sign in with on the hidden admin portal.
          </p>

          {!isAdminApiConfigured() ? (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              The admin API is not configured yet. Add `VITE_SUPABASE_PROJECT_ID` and
              `VITE_SUPABASE_ANON_KEY` to the frontend environment before completing setup.
            </div>
          ) : null}

          <form onSubmit={submitSetup} className="mt-8 space-y-4">
            <Field label="Operator name">
              <TextInput
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="SirDavid Ops"
                required
              />
            </Field>
            <Field label="Email address">
              <TextInput
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="admin@sirdavid.site"
                required
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Choose a strong password"
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Confirm password">
              <TextInput
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Repeat the password"
                autoComplete="new-password"
                required
              />
            </Field>

            {error ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Link
                to="/secure-admin-portal-xyz"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to portal
              </Link>
              <button
                type="submit"
                disabled={submitting || !isAdminApiConfigured()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {submitting
                  ? mode === "reset"
                    ? "Resetting..."
                    : "Setting up..."
                  : mode === "reset"
                    ? "Reset access"
                    : "Complete setup"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
