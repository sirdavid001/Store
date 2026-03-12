import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Boxes,
  CircleDollarSign,
  LockKeyhole,
  PackageCheck,
  ReceiptText,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SelectField } from "../components/SelectField";
import { departmentCards } from "../data/storeData";
import { useStore } from "../context/StoreContext";

const orderStatusOptions = [
  { value: "Payment Review", label: "Payment Review" },
  { value: "Packed", label: "Packed" },
  { value: "In Transit", label: "In Transit" },
  { value: "Delivered", label: "Delivered" },
];

const shippingModeOptions = [
  { value: "flat", label: "Flat fee" },
  { value: "percentage", label: "Percentage" },
  { value: "free-threshold", label: "Free threshold" },
];

const emptyDraft = {
  id: "",
  name: "",
  brand: "",
  category: "phones",
  condition: "New",
  priceUsd: 999,
  stock: 5,
  badge: "",
  shortDescription: "",
  description: "",
  image: "",
  gallery: [],
  specs: [["Display", ""], ["Storage", ""], ["Battery", ""], ["Extras", ""]],
};

function buildDraft(product) {
  if (!product) {
    return {
      ...emptyDraft,
      gallery: [...emptyDraft.gallery],
      specs: emptyDraft.specs.map((entry) => [...entry]),
    };
  }

  return {
    ...product,
    gallery: product.gallery ?? [product.image],
  };
}

export function AdminPortalPage() {
  const {
    adminAuthenticated,
    loginAdmin,
    logoutAdmin,
    products,
    orders,
    paymentLogs,
    shippingConfig,
    upsertProduct,
    deleteProduct,
    updateOrderStatus,
    updateShipping,
    formatPrice,
  } = useStore();
  const [password, setPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [shippingDraft, setShippingDraft] = useState(shippingConfig);

  useEffect(() => {
    setShippingDraft(shippingConfig);
  }, [shippingConfig]);

  function handleUnlock(event) {
    event.preventDefault();
    if (loginAdmin(password)) {
      setPassword("");
    }
  }

  function openProductEditor(product) {
    setDraft(buildDraft(product));
    setDialogOpen(true);
  }

  function saveProduct(event) {
    event.preventDefault();
    const normalizedId =
      draft.id || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    upsertProduct({
      ...draft,
      id: normalizedId,
      gallery: draft.gallery.length ? draft.gallery : [draft.image],
      image: draft.image || draft.gallery[0],
    });
    setDialogOpen(false);
  }

  if (!adminAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-16 md:px-6">
        <form onSubmit={handleUnlock} className="section-frame w-full rounded-[36px] p-8 text-center">
          <div className="mx-auto inline-flex rounded-full bg-white/8 p-4 text-sky-300">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Secure Admin Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Protected operator route</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Manage catalog entries, shipping rules, payment logs, and verified orders for SirDavid Gadgets.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter portal password"
            className="mt-6 w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
          />
          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            <ShieldCheck className="h-4 w-4" />
            Unlock Portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-16 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Secure Admin Portal</p>
          <h1 className="mt-3 text-5xl font-semibold text-white">Operator controls for SirDavid Gadgets</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => openProductEditor(null)}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            Add Product
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Lock Portal
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {[
          ["Products", products.length, Boxes],
          ["Orders", orders.length, PackageCheck],
          ["Payment logs", paymentLogs.length, ReceiptText],
          ["Cart value rule", shippingConfig.mode, CircleDollarSign],
        ].map(([label, value, Icon]) => (
          <div key={label} className="section-frame rounded-[28px] p-6">
            <div className="inline-flex rounded-2xl bg-white/10 p-3 text-sky-300">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-6 text-sm font-medium text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <Tabs.Root defaultValue="products" className="space-y-6">
        <Tabs.List className="flex flex-wrap gap-3 rounded-full border border-white/10 bg-white/5 p-2">
          {["products", "orders", "shipping", "payments"].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="rounded-full px-4 py-2 text-sm font-semibold capitalize text-slate-300 transition hover:text-white data-[state=active]:bg-white data-[state=active]:text-slate-950"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="products" className="space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="section-frame grid gap-4 rounded-[30px] p-4 lg:grid-cols-[160px_1fr_auto]"
            >
              <img src={product.image} alt={product.name} className="h-36 w-full rounded-[24px] object-cover" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    {product.category}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white">
                    {product.condition}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-white">{product.name}</h2>
                <p className="text-sm leading-7 text-slate-300">{product.shortDescription}</p>
              </div>
              <div className="flex flex-col items-end justify-between gap-4">
                <div className="text-right">
                  <p className="text-2xl font-semibold text-white">{formatPrice(product.priceUsd, "USD")}</p>
                  <p className="text-sm text-slate-400">{product.stock} in stock</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openProductEditor(product)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </Tabs.Content>

        <Tabs.Content value="orders" className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="section-frame rounded-[30px] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    {order.orderNumber}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">{order.customer}</h2>
                  <p className="text-sm text-slate-400">{order.email}</p>
                </div>
                <div className="w-full max-w-[220px]">
                  <SelectField
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                    options={orderStatusOptions}
                    placeholder="Order status"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tracking</p>
                  <p className="mt-2 text-sm font-semibold text-white">{order.trackingNumber}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment</p>
                  <p className="mt-2 text-sm font-semibold text-white">{order.paymentStatus}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Amount</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {formatPrice(order.amountUsd, order.currency)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </Tabs.Content>

        <Tabs.Content value="shipping" className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateShipping(shippingDraft);
            }}
            className="section-frame rounded-[32px] p-6"
          >
            <h2 className="text-2xl font-semibold text-white">Shipping configuration</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Configure the storefront shipping rule, then save once to update checkout totals and order estimates.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Mode</label>
                <SelectField
                  value={shippingDraft.mode}
                  onValueChange={(value) => setShippingDraft({ ...shippingDraft, mode: value })}
                  options={shippingModeOptions}
                  placeholder="Shipping mode"
                />
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Flat fee (USD)</span>
                <input
                  type="number"
                  value={shippingDraft.flatFeeUsd}
                  onChange={(event) =>
                    setShippingDraft({ ...shippingDraft, flatFeeUsd: event.target.value })
                  }
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Percentage rate</span>
                <input
                  type="number"
                  value={shippingDraft.percentageRate}
                  onChange={(event) =>
                    setShippingDraft({ ...shippingDraft, percentageRate: event.target.value })
                  }
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Free threshold (USD)</span>
                <input
                  type="number"
                  value={shippingDraft.freeThresholdUsd}
                  onChange={(event) =>
                    setShippingDraft({ ...shippingDraft, freeThresholdUsd: event.target.value })
                  }
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
              >
                <Save className="h-4 w-4" />
                Save Shipping
              </button>
            </div>
          </form>
        </Tabs.Content>

        <Tabs.Content value="payments" className="space-y-4">
          {paymentLogs.map((log) => (
            <article key={log.id} className="section-frame rounded-[30px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    {log.reference}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{log.status}</h2>
                </div>
                <p className="text-lg font-semibold text-white">{formatPrice(log.amountUsd, "USD")}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {log.channel}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </Tabs.Content>
      </Tabs.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(840px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[36px] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Dialog.Title className="text-3xl font-semibold text-white">
                  {draft.id ? "Edit product" : "Add product"}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-slate-400">
                  Manage premium catalog details in USD, including stock, images, and merchandising copy.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-full border border-white/10 bg-white/5 p-2 text-white">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={saveProduct} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Brand</span>
                  <input
                    value={draft.brand}
                    onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  />
                </label>
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-white">Category</span>
                  <SelectField
                    value={draft.category}
                    onValueChange={(value) => setDraft({ ...draft, category: value })}
                    options={departmentCards.map((department) => ({
                      value: department.id,
                      label: department.label,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-white">Condition</span>
                  <SelectField
                    value={draft.condition}
                    onValueChange={(value) => setDraft({ ...draft, condition: value })}
                    options={[
                      { value: "New", label: "New" },
                      { value: "Certified Refurbished", label: "Certified Refurbished" },
                      { value: "Open Box", label: "Open Box" },
                    ]}
                  />
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Price (USD)</span>
                  <input
                    type="number"
                    value={draft.priceUsd}
                    onChange={(event) => setDraft({ ...draft, priceUsd: event.target.value })}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Stock</span>
                  <input
                    type="number"
                    value={draft.stock}
                    onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-white">Hero image URL</span>
                  <input
                    value={draft.image}
                    onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                    className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Short description</span>
                <textarea
                  value={draft.shortDescription}
                  onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })}
                  rows={3}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">Long description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  rows={4}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                />
              </label>
              <div className="flex justify-end gap-3">
                <Dialog.Close className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
                >
                  <Save className="h-4 w-4" />
                  Save Product
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
