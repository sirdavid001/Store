import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  Bug,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Package,
  Pencil,
  Plus,
  Shield,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  AdminApiError,
  clearStoredAdminToken,
  createAdminProduct,
  debugAdmin,
  deleteAdminProduct,
  fetchAdminExchangeRate,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminShipping,
  getStoredAdminToken,
  isAdminApiConfigured,
  loginAdmin,
  updateAdminExchangeRate,
  updateAdminOrder,
  updateAdminProduct,
  updateAdminShipping,
  uploadAdminImage,
  verifyAdminSession,
} from "../app/lib/api";

const ORDER_TABS = [
  { value: "orders", label: "Orders", icon: Package },
  { value: "products", label: "Products", icon: ShoppingBag },
  { value: "shipping", label: "Shipping", icon: Truck },
];

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PRODUCT_CATEGORY_OPTIONS = [
  { value: "phones", label: "Phones" },
  { value: "laptops", label: "Laptops" },
  { value: "tablets", label: "Tablets" },
  { value: "accessories", label: "Accessories" },
];

const PRODUCT_CONDITION_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Refurbished", label: "Refurbished" },
];

const SHIPPING_MODE_OPTIONS = [
  { value: "flat", label: "Flat fee" },
  { value: "percentage", label: "Percentage" },
  { value: "free-threshold", label: "Free above threshold" },
];

const LOGIN_HINTS = {
  no_account: {
    title: "No Account Found",
    copy: "No operator account is active for this portal yet. Complete the first-time setup flow to create your admin credentials.",
    href: "/admin-setup-first-time",
    action: "Go to setup",
  },
  wrong_password: {
    title: "Incorrect Password",
    copy: "The email exists, but the password does not match. Reset or re-run setup if this is a fresh deployment.",
    href: "/admin-setup-first-time?mode=reset",
    action: "Reset access",
  },
  incomplete_setup: {
    title: "Setup Incomplete",
    copy: "The admin backend has not finished its initial provisioning. Return to setup to complete the secure operator flow.",
    href: "/admin-setup-first-time",
    action: "Finish setup",
  },
};

const EMPTY_PRODUCT_FORM = {
  id: "",
  name: "",
  brand: "",
  category: "phones",
  condition: "New",
  priceUsd: "",
  stock: "",
  description: "",
  imageUrl: "",
  extraImageUrls: [""],
};

const DEFAULT_SHIPPING_SETTINGS = {
  mode: "flat",
  value: 3500,
  freeThresholdEnabled: false,
  freeThreshold: 250000,
  exchangeRateNgnUsd: 1545,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function money(amount, currency) {
  return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(toNumber(amount, 0));
}

function formatDate(value) {
  if (!value) {
    return "Just now";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Just now";
  }

  return parsed.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeOrderStatus(value) {
  const normalized = String(value || "pending").trim().toLowerCase();

  if (normalized.includes("confirm")) {
    return "confirmed";
  }
  if (normalized.includes("ship") || normalized.includes("transit")) {
    return "shipped";
  }
  if (normalized.includes("deliver")) {
    return "delivered";
  }
  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  return "pending";
}

function statusTone(status) {
  return {
    pending: "bg-amber-100 text-amber-700 ring-amber-200",
    confirmed: "bg-blue-100 text-blue-700 ring-blue-200",
    shipped: "bg-violet-100 text-violet-700 ring-violet-200",
    delivered: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 ring-rose-200",
  }[normalizeOrderStatus(status)];
}

function normalizeCategory(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("laptop")) return "laptops";
  if (normalized.includes("tablet")) return "tablets";
  if (normalized.includes("access")) return "accessories";
  return "phones";
}

function normalizeCondition(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("refurb")) return "Refurbished";
  if (normalized.includes("used")) return "Used";
  return "New";
}

function pick(record, keys, fallback = "") {
  for (const key of keys) {
    if (record && record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return fallback;
}

function coerceArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return [value];
}

function extractAddress(rawAddress) {
  if (!rawAddress) {
    return "No shipping address supplied yet.";
  }

  if (typeof rawAddress === "string") {
    return rawAddress;
  }

  return [
    rawAddress.full_name,
    rawAddress.name,
    rawAddress.address_1,
    rawAddress.address1,
    rawAddress.street,
    rawAddress.city,
    rawAddress.state,
    rawAddress.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeOrder(rawOrder, exchangeRate) {
  const items = coerceArray(rawOrder.items || rawOrder.order_items || rawOrder.orderItems).map(
    (item, index) => {
      const quantity = toNumber(pick(item, ["quantity", "qty"]), 1);
      const lineTotalNgn = toNumber(
        pick(item, ["line_total_ngn", "lineTotalNgn", "line_total", "lineTotal"]),
        0,
      );
      const unitPriceNgn =
        toNumber(pick(item, ["unit_price_ngn", "unitPriceNgn", "unit_price", "unitPrice"]), 0) ||
        (lineTotalNgn && quantity ? lineTotalNgn / quantity : 0);

      return {
        id: String(pick(item, ["id", "sku"], `${pick(item, ["name", "product_name"], "item")}-${index}`)),
        name: pick(item, ["name", "product_name", "productName"], "Unknown item"),
        quantity,
        unitPriceNgn,
        lineTotalNgn: lineTotalNgn || unitPriceNgn * quantity,
      };
    },
  );

  const customer =
    rawOrder.customer ||
    rawOrder.customer_details ||
    rawOrder.customerDetails ||
    rawOrder.user ||
    {};
  const customerName =
    pick(rawOrder, ["customer_name", "customerName", "name"]) ||
    pick(customer, ["name", "full_name", "fullName"], "Unknown customer");
  const customerEmail =
    pick(rawOrder, ["customer_email", "customerEmail", "email"]) ||
    pick(customer, ["email"], "No email");
  const fallbackTotalUsd = toNumber(pick(rawOrder, ["amountUsd", "amount_usd", "total_usd"]), 0);

  return {
    id: String(
      pick(rawOrder, ["id", "order_id", "orderId", "reference"], pick(rawOrder, ["order_number", "orderNumber"], toId("order"))),
    ),
    reference: pick(rawOrder, ["order_ref", "orderRef", "order_number", "orderNumber", "reference"], "Pending reference"),
    customerName,
    customerEmail,
    items,
    itemsSummary: items.length
      ? items.map((item) => `${item.name} x${item.quantity}`).join(", ")
      : "No items",
    totalNgn:
      toNumber(pick(rawOrder, ["total_ngn", "totalNgn", "amount_ngn", "amountNgn", "total_amount", "totalAmount"]), 0) ||
      fallbackTotalUsd * exchangeRate,
    status: normalizeOrderStatus(pick(rawOrder, ["status", "order_status"], "pending")),
    createdAt: pick(rawOrder, ["created_at", "createdAt", "date"], ""),
    shippingAddress: extractAddress(
      rawOrder.shipping_address ||
        rawOrder.shippingAddress ||
        rawOrder.address ||
        rawOrder.delivery_address ||
        rawOrder.deliveryAddress,
    ),
    paymentMethod: pick(rawOrder, ["payment_method", "paymentMethod"], "Paystack"),
    paystackReference: pick(rawOrder, ["paystack_reference", "paystackReference", "reference"], "Pending"),
  };
}

function normalizeProduct(rawProduct, exchangeRate) {
  const images = coerceArray(
    rawProduct.images ||
      rawProduct.gallery ||
      rawProduct.extra_image_urls ||
      rawProduct.extraImageUrls,
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const imageUrl = pick(rawProduct, ["image_url", "imageUrl", "image"], images[0] || "");
  const extraImageUrls = images.filter((item) => item !== imageUrl).slice(0, 3);
  const priceUsd = toNumber(
    pick(rawProduct, ["price_usd", "priceUsd", "usd_price", "price"]),
    0,
  );

  return {
    id: String(pick(rawProduct, ["id", "slug"], toSlug(pick(rawProduct, ["name"], toId("product"))))),
    name: pick(rawProduct, ["name"], "Untitled product"),
    brand: pick(rawProduct, ["brand"], "Unknown"),
    category: normalizeCategory(pick(rawProduct, ["category"], "phones")),
    condition: normalizeCondition(pick(rawProduct, ["condition"], "New")),
    priceUsd,
    priceNgn:
      toNumber(pick(rawProduct, ["price_ngn", "priceNgn"]), 0) || priceUsd * exchangeRate,
    stock: toNumber(pick(rawProduct, ["stock", "stock_quantity", "stockQuantity"]), 0),
    description: pick(rawProduct, ["description", "short_description", "shortDescription"], ""),
    imageUrl,
    extraImageUrls,
  };
}

function normalizeShippingPayload(rawShipping) {
  const payload = rawShipping?.settings || rawShipping?.data?.settings || rawShipping?.shipping || rawShipping?.data || rawShipping || {};
  const rawMode = String(pick(payload, ["mode", "shipping_mode"], "flat")).toLowerCase();
  const mode =
    rawMode.includes("percent") ? "percentage" : rawMode.includes("free") ? "free-threshold" : "flat";
  const freeThreshold =
    toNumber(pick(payload, ["free_threshold", "freeThreshold", "threshold", "free_above"]), 0) || 0;

  return {
    mode,
    value: toNumber(
      pick(payload, ["value", "flat_fee", "flatFee", "percentage", "percentage_rate", "percentageRate"]),
      mode === "percentage" ? 5 : 3500,
    ),
    freeThresholdEnabled: mode === "free-threshold" || freeThreshold > 0,
    freeThreshold,
    exchangeRateNgnUsd: toNumber(
      pick(payload, ["exchange_rate_ngn_usd", "exchangeRateNgnUsd", "ngn_usd_rate", "ngnUsdRate"]),
      DEFAULT_SHIPPING_SETTINGS.exchangeRateNgnUsd,
    ),
  };
}

function buildProductForm(product) {
  if (!product) {
    return EMPTY_PRODUCT_FORM;
  }

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    condition: product.condition,
    priceUsd: String(product.priceUsd || ""),
    stock: String(product.stock || ""),
    description: product.description || "",
    imageUrl: product.imageUrl || "",
    extraImageUrls: product.extraImageUrls?.length ? [...product.extraImageUrls] : [""],
  };
}

function buildProductPayload(form) {
  const categoryLabel =
    PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === form.category)?.label || "Phones";

  return {
    id: form.id || undefined,
    name: form.name.trim(),
    slug: form.id || toSlug(form.name),
    brand: form.brand.trim(),
    category: categoryLabel,
    condition: form.condition,
    priceUsd: toNumber(form.priceUsd, 0),
    price_usd: toNumber(form.priceUsd, 0),
    stock: toNumber(form.stock, 0),
    stock_quantity: toNumber(form.stock, 0),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    image_url: form.imageUrl.trim(),
    extraImageUrls: form.extraImageUrls.map((value) => value.trim()).filter(Boolean).slice(0, 3),
    extra_image_urls: form.extraImageUrls.map((value) => value.trim()).filter(Boolean).slice(0, 3),
  };
}

function LoginHintCard({ error }) {
  if (!error?.code || !LOGIN_HINTS[error.code]) {
    return null;
  }

  const hint = LOGIN_HINTS[error.code];

  return (
    <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-white p-2 text-blue-600 shadow-sm">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-950">{hint.title}</p>
          <p className="leading-6 text-slate-600">{hint.copy}</p>
          <Link
            to={hint.href}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-slate-800"
          >
            {hint.action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PortalCard({ children, className = "" }) {
  return (
    <div
      className={clsx(
        "rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.12)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
      className={clsx(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        props.className,
      )}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={clsx(
        "min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        props.className,
      )}
    />
  );
}

function SelectInput({ options, className = "", ...props }) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function AdminPortalPage() {
  const [authState, setAuthState] = useState({
    checking: true,
    authenticated: false,
    admin: null,
  });
  const [activeTab, setActiveTab] = useState("orders");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [exchangeSaving, setExchangeSaving] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [shippingSettings, setShippingSettings] = useState(DEFAULT_SHIPPING_SETTINGS);
  const [exchangeRateDraft, setExchangeRateDraft] = useState(
    String(DEFAULT_SHIPPING_SETTINGS.exchangeRateNgnUsd),
  );
  const [shippingDraft, setShippingDraft] = useState(DEFAULT_SHIPPING_SETTINGS);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    verifyStoredSession();
  }, []);

  useEffect(() => {
    if (!authState.authenticated || activeTab !== "orders") {
      return;
    }

    function refreshVisibleOrders() {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadOrders({ silent: true });
    }

    window.addEventListener("focus", refreshVisibleOrders);
    document.addEventListener("visibilitychange", refreshVisibleOrders);

    return () => {
      window.removeEventListener("focus", refreshVisibleOrders);
      document.removeEventListener("visibilitychange", refreshVisibleOrders);
    };
  }, [authState.authenticated, activeTab]);

  async function verifyStoredSession() {
    if (!getStoredAdminToken()) {
      setAuthState({ checking: false, authenticated: false, admin: null });
      return;
    }

    try {
      const session = await verifyAdminSession();
      setAuthState({ checking: false, authenticated: true, admin: session.admin });
      await loadDashboardData();
    } catch (error) {
      clearStoredAdminToken();
      setAuthState({ checking: false, authenticated: false, admin: null });
      if (error instanceof AdminApiError && error.code !== "missing_token") {
        toast.error(error.message);
      }
    }
  }

  async function loadDashboardData() {
    setDashboardLoading(true);

    const [ordersResult, productsResult, shippingResult, exchangeRateResult] = await Promise.allSettled([
      fetchAdminOrders(),
      fetchAdminProducts(),
      fetchAdminShipping(),
      fetchAdminExchangeRate(),
    ]);

    if (ordersResult.status === "fulfilled") {
      const normalizedOrders = ordersResult.value.map((order) =>
        normalizeOrder(order, shippingDraft.exchangeRateNgnUsd),
      );
      setOrders(normalizedOrders);
      setOrderStatusDrafts(
        Object.fromEntries(normalizedOrders.map((order) => [order.id, order.status])),
      );
    } else {
      toast.error(ordersResult.reason?.message || "Could not load orders.");
    }

    if (productsResult.status === "fulfilled") {
      setProducts(
        productsResult.value.map((product) =>
          normalizeProduct(product, shippingDraft.exchangeRateNgnUsd),
        ),
      );
    } else {
      toast.error(productsResult.reason?.message || "Could not load products.");
    }

    if (shippingResult.status === "fulfilled") {
      const normalizedShipping = normalizeShippingPayload(shippingResult.value);
      setShippingSettings(normalizedShipping);
      setShippingDraft(normalizedShipping);
      setExchangeRateDraft(String(normalizedShipping.exchangeRateNgnUsd));
    } else {
      toast.error(shippingResult.reason?.message || "Could not load shipping settings.");
    }

    if (exchangeRateResult.status === "fulfilled") {
      const payload = exchangeRateResult.value?.data || exchangeRateResult.value || {};
      const nextRate = toNumber(
        pick(payload, ["rate", "exchange_rate_ngn_usd", "exchangeRateNgnUsd"], 0),
        0,
      );

      if (nextRate) {
        setShippingSettings((current) => ({ ...current, exchangeRateNgnUsd: nextRate }));
        setShippingDraft((current) => ({ ...current, exchangeRateNgnUsd: nextRate }));
        setExchangeRateDraft(String(nextRate));
      }
    }

    setDashboardLoading(false);
  }

  async function loadOrders({ silent = false } = {}) {
    if (!silent) {
      setOrdersLoading(true);
    }

    try {
      const payload = await fetchAdminOrders();
      const normalized = payload.map((order) =>
        normalizeOrder(order, shippingSettings.exchangeRateNgnUsd),
      );
      setOrders(normalized);
      setOrderStatusDrafts(
        Object.fromEntries(normalized.map((order) => [order.id, order.status])),
      );
    } catch (error) {
      if (!silent) {
        toast.error(error.message || "Could not refresh orders.");
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    try {
      const payload = await fetchAdminProducts();
      setProducts(
        payload.map((product) => normalizeProduct(product, shippingSettings.exchangeRateNgnUsd)),
      );
    } catch (error) {
      toast.error(error.message || "Could not refresh products.");
    } finally {
      setProductsLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setAuthError(null);
    setSubmittingAuth(true);

    try {
      const session = await loginAdmin(credentials);
      setAuthState({ checking: false, authenticated: true, admin: session.admin });
      setCredentials({ email: "", password: "" });
      toast.success("Admin session verified.");
      await loadDashboardData();
    } catch (error) {
      const apiError =
        error instanceof AdminApiError
          ? error
          : new AdminApiError(error.message || "Could not sign in.");
      setAuthError(apiError);
    } finally {
      setSubmittingAuth(false);
    }
  }

  function logout() {
    clearStoredAdminToken();
    setAuthState({ checking: false, authenticated: false, admin: null });
    setOrders([]);
    setProducts([]);
    setExpandedOrderId("");
    setAuthError(null);
    toast.success("Admin session cleared.");
  }

  async function runDebugCheck() {
    setDebugging(true);

    try {
      const payload = await debugAdmin();
      toast.success(
        pick(payload, ["message", "status", "data.message"], "Debug endpoint responded correctly."),
      );
    } catch (error) {
      toast.error(error.message || "Debug endpoint failed.");
    } finally {
      setDebugging(false);
    }
  }

  async function persistOrderStatus(orderId) {
    const nextStatus = orderStatusDrafts[orderId];
    const previous = orders;

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );

    try {
      await updateAdminOrder(orderId, nextStatus);
      toast.success("Order status updated.");
    } catch (error) {
      setOrders(previous);
      toast.error(error.message || "Could not update order status.");
    }
  }

  function openCreateProduct() {
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductDialogOpen(true);
  }

  function openEditProduct(product) {
    setProductForm(buildProductForm(product));
    setProductDialogOpen(true);
  }

  async function handlePrimaryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
    setProductForm((current) => ({ ...current, imageUrl: previewUrl }));

    try {
      const uploadedUrl = await uploadAdminImage(file);
      setProductForm((current) => ({ ...current, imageUrl: uploadedUrl }));
      toast.success("Image uploaded.");
    } catch (error) {
      setProductForm((current) => ({ ...current, imageUrl: "" }));
      toast.error(error.message || "Could not upload image.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSavingProduct(true);

    const payload = buildProductPayload(productForm);
    const normalized = normalizeProduct(
      {
        ...payload,
        id: productForm.id || payload.slug,
      },
      shippingSettings.exchangeRateNgnUsd,
    );
    const isEditing = Boolean(productForm.id);
    const previous = products;

    setProducts((current) =>
      isEditing
        ? current.map((product) => (product.id === productForm.id ? normalized : product))
        : [normalized, ...current],
    );
    setProductDialogOpen(false);

    try {
      const result = isEditing
        ? await updateAdminProduct(productForm.id, payload)
        : await createAdminProduct(payload);
      const persisted = normalizeProduct(
        result?.product || result?.data?.product || result?.data || result || normalized,
        shippingSettings.exchangeRateNgnUsd,
      );
      setProducts((current) =>
        isEditing
          ? current.map((product) => (product.id === normalized.id ? persisted : product))
          : current.map((product, index) => (index === 0 ? persisted : product)),
      );
      toast.success(isEditing ? "Product updated." : "Product created.");
    } catch (error) {
      setProducts(previous);
      toast.error(error.message || "Could not save product.");
      setProductDialogOpen(true);
    } finally {
      setSavingProduct(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) {
      return;
    }

    const previous = products;
    setProducts((current) => current.filter((product) => product.id !== deleteTarget.id));

    try {
      await deleteAdminProduct(deleteTarget.id);
      toast.success("Product deleted.");
    } catch (error) {
      setProducts(previous);
      toast.error(error.message || "Could not delete product.");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function saveShippingSettings(event) {
    event.preventDefault();
    setShippingSaving(true);

    const payload = {
      mode: shippingDraft.mode,
      value: toNumber(shippingDraft.value, 0),
      freeThresholdEnabled: Boolean(shippingDraft.freeThresholdEnabled),
      freeThreshold: toNumber(shippingDraft.freeThreshold, 0),
      exchangeRateNgnUsd: shippingSettings.exchangeRateNgnUsd,
    };

    try {
      await updateAdminShipping(payload);
      setShippingSettings((current) => ({
        ...current,
        mode: payload.mode,
        value: payload.value,
        freeThresholdEnabled: payload.freeThresholdEnabled,
        freeThreshold: payload.freeThreshold,
      }));
      toast.success("Shipping settings saved.");
    } catch (error) {
      toast.error(error.message || "Could not save shipping settings.");
    } finally {
      setShippingSaving(false);
    }
  }

  async function saveExchangeRate(event) {
    event.preventDefault();
    setExchangeSaving(true);

    const nextRate = toNumber(exchangeRateDraft, shippingSettings.exchangeRateNgnUsd);

    try {
      await updateAdminExchangeRate(nextRate);
      setShippingSettings((current) => ({ ...current, exchangeRateNgnUsd: nextRate }));
      setShippingDraft((current) => ({ ...current, exchangeRateNgnUsd: nextRate }));
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          priceNgn: product.priceUsd * nextRate,
        })),
      );
      toast.success("Exchange rate updated.");
    } catch (error) {
      toast.error(error.message || "Could not update exchange rate.");
    } finally {
      setExchangeSaving(false);
    }
  }

  if (authState.checking) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(74,123,255,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#07101f_0%,#040816_48%,#02040d_100%)] px-4 py-16 text-white md:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <PortalCard className="w-full max-w-xl bg-white/10 p-10 text-center text-white shadow-[0_32px_120px_rgba(2,6,23,0.45)]">
            <div className="mx-auto inline-flex rounded-3xl bg-white/10 p-4 text-sky-300">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
              Secure Admin Portal
            </p>
            <h1 className="mt-3 font-['Sora'] text-4xl font-semibold">Verifying operator session</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Checking for a valid admin token and loading SirDavid Gadgets operations.
            </p>
          </PortalCard>
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(74,123,255,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#07101f_0%,#040816_48%,#02040d_100%)] px-4 py-12 text-white md:px-6">
        <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center gap-8 md:grid md:grid-cols-[1.05fr_480px]">
          <div className="rounded-[36px] border border-white/10 bg-white/8 p-8 shadow-[0_32px_120px_rgba(2,6,23,0.4)] backdrop-blur md:p-12">
            <div className="inline-flex items-center gap-4">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_18px_40px_rgba(74,123,255,0.3)]">
                <Shield className="h-7 w-7 text-white" />
              </span>
              <div>
                <p className="font-['Sora'] text-2xl font-semibold">SirDavid</p>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Admin Portal
                </p>
              </div>
            </div>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
              Secure internal operations
            </p>
            <h1 className="mt-4 max-w-xl font-['Sora'] text-4xl font-semibold leading-[1.02] md:text-6xl">
              Orders, products, and shipping in one hidden control room.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Authenticate with your operator email and password. This hidden route is designed for
              SirDavid Gadgets staff using token-based access backed by the external admin service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                X-Admin-Token sessions
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                Supabase edge function
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                Paystack-aware order ops
              </span>
            </div>
          </div>

          <PortalCard className="self-center p-8 md:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
              Admin Sign In
            </p>
            <h2 className="mt-3 font-['Sora'] text-3xl font-semibold text-slate-950">
              Operator login
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use the email address created during first-time setup.
            </p>

            {!isAdminApiConfigured() ? (
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                The admin API is not configured yet. Add `VITE_SUPABASE_PROJECT_ID` and
                `VITE_SUPABASE_ANON_KEY` before using this portal.
              </div>
            ) : null}

            <form onSubmit={submitLogin} className="mt-8 space-y-4">
              <Field label="Email address">
                <TextInput
                  type="email"
                  value={credentials.email}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@sirdavid.site"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Enter your secure password"
                  autoComplete="current-password"
                  required
                />
              </Field>

              {authError ? (
                <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {authError.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submittingAuth || !isAdminApiConfigured()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingAuth ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {submittingAuth ? "Signing in..." : "Enter Admin Portal"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <LoginHintCard error={authError} />
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                First deployment or fresh backend?{" "}
                <Link to="/admin-setup-first-time" className="font-semibold text-slate-950 hover:text-blue-700">
                  Complete first-time setup
                </Link>
                .
              </div>
            </div>
          </PortalCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(74,123,255,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#07101f_0%,#040816_48%,#02040d_100%)] pb-12 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_18px_40px_rgba(74,123,255,0.3)]">
              <Shield className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-['Sora'] text-xl font-semibold">SirDavid</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300">
                Admin Portal
              </p>
            </div>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="min-w-0 flex-1">
            <Tabs.List className="mx-auto flex w-fit flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/8 p-2">
              {ORDER_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white data-[state=active]:bg-white data-[state=active]:text-slate-950"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </Tabs.Root>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runDebugCheck}
              disabled={debugging}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {debugging ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
              <span className="hidden sm:inline">Debug</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <section className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <PortalCard className="bg-white text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              Authenticated operator
            </p>
            <h1 className="mt-3 font-['Sora'] text-3xl font-semibold md:text-4xl">
              Welcome back, {authState.admin?.name || "Admin"}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Hidden route access is active. Manage verified orders, inventory, shipping logic,
              and the NGN/USD exchange baseline from one control surface.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                {authState.admin?.email}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 capitalize">
                {authState.admin?.role || "operator"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                Token session active
              </span>
            </div>
          </PortalCard>

          <PortalCard className="bg-white">
            <p className="text-sm text-slate-500">Orders</p>
            <p className="mt-2 font-['Sora'] text-4xl font-semibold">{orders.length}</p>
            <p className="mt-3 text-sm text-slate-500">All order records loaded from the admin API.</p>
          </PortalCard>
          <PortalCard className="bg-white">
            <p className="text-sm text-slate-500">Products</p>
            <p className="mt-2 font-['Sora'] text-4xl font-semibold">{products.length}</p>
            <p className="mt-3 text-sm text-slate-500">Visible catalog entries managed from this portal.</p>
          </PortalCard>
          <PortalCard className="bg-white">
            <p className="text-sm text-slate-500">NGN / USD</p>
            <p className="mt-2 font-['Sora'] text-4xl font-semibold">
              {toNumber(shippingSettings.exchangeRateNgnUsd).toLocaleString("en-NG")}
            </p>
            <p className="mt-3 text-sm text-slate-500">Current exchange baseline used for admin previews.</p>
          </PortalCard>
        </section>

        {dashboardLoading ? (
          <PortalCard className="flex items-center justify-center gap-3 bg-white py-20 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
            Loading live admin data...
          </PortalCard>
        ) : null}

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.Content value="orders" className="space-y-5">
            <PortalCard className="bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                    Orders
                  </p>
                  <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-slate-950">
                    Verified order queue
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadOrders()}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"
                >
                  {ordersLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <BadgeDollarSign className="h-4 w-4 text-blue-600" />
                  )}
                  Refresh orders
                </button>
              </div>

              {!orders.length ? (
                <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <Package className="mx-auto h-9 w-9 text-slate-300" />
                  <h3 className="mt-4 font-['Sora'] text-2xl font-semibold text-slate-900">
                    No orders yet
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Once the backend returns verified orders, they will appear here with status
                    controls and full payment metadata.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4">Order Ref</th>
                          <th className="px-4 py-4">Customer</th>
                          <th className="px-4 py-4">Items</th>
                          <th className="px-4 py-4">Total</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Date</th>
                          <th className="px-4 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const expanded = expandedOrderId === order.id;
                          return (
                            <Fragment key={order.id}>
                              <tr
                                onClick={() =>
                                  setExpandedOrderId((current) =>
                                    current === order.id ? "" : order.id,
                                  )
                                }
                                className="cursor-pointer border-t border-slate-200 bg-white transition hover:bg-slate-50"
                              >
                                <td className="px-4 py-4 font-semibold text-slate-950">
                                  <div className="flex items-center gap-3">
                                    <span>{order.reference}</span>
                                    {expanded ? (
                                      <ChevronUp className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="font-medium text-slate-900">{order.customerName}</p>
                                  <p className="mt-1 text-xs text-slate-500">{order.customerEmail}</p>
                                </td>
                                <td className="max-w-[260px] px-4 py-4 text-slate-600">
                                  <span className="line-clamp-2">{order.itemsSummary}</span>
                                </td>
                                <td className="px-4 py-4 font-semibold text-slate-900">
                                  {money(order.totalNgn, "NGN")}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={clsx(
                                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                                      statusTone(order.status),
                                    )}
                                  >
                                    {ORDER_STATUS_OPTIONS.find((option) => option.value === order.status)
                                      ?.label || order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                                <td
                                  className="px-4 py-4"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <div className="flex justify-end gap-2">
                                    <SelectInput
                                      value={orderStatusDrafts[order.id] || order.status}
                                      onChange={(event) =>
                                        setOrderStatusDrafts((current) => ({
                                          ...current,
                                          [order.id]: event.target.value,
                                        }))
                                      }
                                      options={ORDER_STATUS_OPTIONS}
                                      className="min-w-[140px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => persistOrderStatus(order.id)}
                                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-slate-800"
                                    >
                                      Update
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expanded ? (
                                <tr className="border-t border-slate-100 bg-slate-50">
                                  <td colSpan={7} className="px-5 py-5">
                                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                                      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                                          Item breakdown
                                        </p>
                                        <div className="mt-4 space-y-3">
                                          {order.items.map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3"
                                            >
                                              <div>
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                <p className="text-xs text-slate-500">
                                                  Qty {item.quantity} · {money(item.unitPriceNgn, "NGN")} each
                                                </p>
                                              </div>
                                              <p className="font-semibold text-slate-900">
                                                {money(item.lineTotalNgn, "NGN")}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                                            Shipping address
                                          </p>
                                          <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {order.shippingAddress}
                                          </p>
                                        </div>
                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                                            Payment details
                                          </p>
                                          <dl className="mt-3 space-y-3 text-sm text-slate-600">
                                            <div className="flex items-center justify-between gap-4">
                                              <dt>Method</dt>
                                              <dd className="font-semibold text-slate-900">{order.paymentMethod}</dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                              <dt>Paystack ref</dt>
                                              <dd className="font-semibold text-slate-900">
                                                {order.paystackReference}
                                              </dd>
                                            </div>
                                          </dl>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </PortalCard>
          </Tabs.Content>

          <Tabs.Content value="products" className="space-y-5">
            <PortalCard className="bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                    Products
                  </p>
                  <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-slate-950">
                    Catalog manager
                  </h2>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => loadProducts()}
                    disabled={productsLoading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {productsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    type="button"
                    onClick={openCreateProduct}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </button>
                </div>
              </div>

              {!products.length ? (
                <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <ShoppingBag className="mx-auto h-9 w-9 text-slate-300" />
                  <h3 className="mt-4 font-['Sora'] text-2xl font-semibold text-slate-900">
                    No products loaded
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Create your first catalog entry or connect the backend product list to this
                    portal.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            No image
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
                          {product.condition}
                        </span>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-600">
                              {PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === product.category)
                                ?.label || product.category}
                            </p>
                            <h3 className="mt-2 font-['Sora'] text-xl font-semibold text-slate-950">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">{product.brand}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm leading-7 text-slate-600">{product.description}</p>

                        <div className="grid gap-3 rounded-[22px] bg-slate-50 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">USD</p>
                            <p className="mt-2 font-semibold text-slate-950">
                              {money(product.priceUsd, "USD")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">NGN preview</p>
                            <p className="mt-2 font-semibold text-slate-950">
                              {money(product.priceUsd * shippingSettings.exchangeRateNgnUsd, "NGN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stock</p>
                            <p className="mt-2 font-semibold text-slate-950">{product.stock}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Extras</p>
                            <p className="mt-2 font-semibold text-slate-950">
                              {product.extraImageUrls.length} additional images
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </PortalCard>
          </Tabs.Content>

          <Tabs.Content value="shipping" className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <PortalCard className="bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                  Current settings
                </p>
                <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-slate-950">
                  Shipping configuration
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mode</p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {SHIPPING_MODE_OPTIONS.find((option) => option.value === shippingSettings.mode)
                        ?.label || shippingSettings.mode}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Value</p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {shippingSettings.mode === "percentage"
                        ? `${shippingSettings.value}%`
                        : money(shippingSettings.value, "NGN")}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Free threshold
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {shippingSettings.freeThresholdEnabled
                        ? money(shippingSettings.freeThreshold, "NGN")
                        : "Disabled"}
                    </p>
                  </div>
                </div>
              </PortalCard>

              <PortalCard className="bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                  Shipping editor
                </p>
                <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-slate-950">
                  Update fees and thresholds
                </h2>
                <form onSubmit={saveShippingSettings} className="mt-6 space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {SHIPPING_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setShippingDraft((current) => ({ ...current, mode: option.value }))
                        }
                        className={clsx(
                          "rounded-[22px] border px-4 py-4 text-left transition",
                          shippingDraft.mode === option.value
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <p className="font-semibold text-slate-950">{option.label}</p>
                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          {option.value === "flat"
                            ? "Fixed NGN fee per order."
                            : option.value === "percentage"
                              ? "Percent of cart total."
                              : "Charge below a threshold, free above it."}
                        </p>
                      </button>
                    ))}
                  </div>

                  <Field
                    label={
                      shippingDraft.mode === "percentage"
                        ? "Percentage value"
                        : "Shipping value"
                    }
                    hint={
                      shippingDraft.mode === "percentage"
                        ? "Enter a percentage of cart value."
                        : "Enter the NGN charge applied to the order."
                    }
                  >
                    <TextInput
                      type="number"
                      min="0"
                      step={shippingDraft.mode === "percentage" ? "0.1" : "1"}
                      value={shippingDraft.value}
                      onChange={(event) =>
                        setShippingDraft((current) => ({
                          ...current,
                          value: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={shippingDraft.freeThresholdEnabled}
                      onChange={(event) =>
                        setShippingDraft((current) => ({
                          ...current,
                          freeThresholdEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Enable free shipping threshold
                    </span>
                  </label>

                  {shippingDraft.freeThresholdEnabled ? (
                    <Field label="Free shipping threshold (NGN)">
                      <TextInput
                        type="number"
                        min="0"
                        step="1"
                        value={shippingDraft.freeThreshold}
                        onChange={(event) =>
                          setShippingDraft((current) => ({
                            ...current,
                            freeThreshold: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  ) : null}

                  <button
                    type="submit"
                    disabled={shippingSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {shippingSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    Save Settings
                  </button>
                </form>

                <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                    Exchange rate manager
                  </p>
                  <h3 className="mt-2 font-['Sora'] text-xl font-semibold text-slate-950">
                    Current NGN / USD rate
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    This controls NGN previews shown across the admin portal.
                  </p>
                  <form onSubmit={saveExchangeRate} className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <TextInput
                      type="number"
                      min="1"
                      step="0.01"
                      value={exchangeRateDraft}
                      onChange={(event) => setExchangeRateDraft(event.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={exchangeSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      {exchangeSaving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeDollarSign className="h-4 w-4 text-blue-600" />
                      )}
                      Update Rate
                    </button>
                  </form>
                </div>
              </PortalCard>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </main>

      <Dialog.Root open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,#f8fbff_0%,#eef3ff_100%)] p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                  {productForm.id ? "Edit product" : "Add product"}
                </p>
                <Dialog.Title className="mt-2 font-['Sora'] text-3xl font-semibold text-slate-950">
                  {productForm.id ? "Update catalog entry" : "Create new catalog entry"}
                </Dialog.Title>
              </div>
              <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={saveProduct} className="mt-8 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Name">
                  <TextInput
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="iPhone 16 Pro Max"
                    required
                  />
                </Field>
                <Field label="Brand">
                  <TextInput
                    value={productForm.brand}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, brand: event.target.value }))
                    }
                    placeholder="Apple"
                    required
                  />
                </Field>
                <Field label="Category">
                  <SelectInput
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, category: event.target.value }))
                    }
                    options={PRODUCT_CATEGORY_OPTIONS}
                  />
                </Field>
                <Field label="Condition">
                  <SelectInput
                    value={productForm.condition}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, condition: event.target.value }))
                    }
                    options={PRODUCT_CONDITION_OPTIONS}
                  />
                </Field>
                <Field label="Price in USD">
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.priceUsd}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, priceUsd: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Stock quantity">
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, stock: event.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <PortalCard className="border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Primary image</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload a file to the admin backend or paste a hosted URL.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    {uploadingImage ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageUpload} />
                  </label>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                  <div className="aspect-[4/3] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                    {productForm.imageUrl ? (
                      <img
                        src={productForm.imageUrl}
                        alt={productForm.name || "Product preview"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No preview yet
                      </div>
                    )}
                  </div>
                  <Field label="Primary image URL">
                    <TextInput
                      value={productForm.imageUrl}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, imageUrl: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </Field>
                </div>
              </PortalCard>

              <Field label="Description">
                <TextArea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Add product details, highlights, and positioning."
                />
              </Field>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Additional image URLs</p>
                    <p className="mt-1 text-sm text-slate-500">Add up to three extra image URLs.</p>
                  </div>
                  {productForm.extraImageUrls.length < 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((current) => ({
                          ...current,
                          extraImageUrls: [...current.extraImageUrls, ""],
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add field
                    </button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {productForm.extraImageUrls.map((imageUrl, index) => (
                    <div key={`extra-${index}`} className="flex items-center gap-3">
                      <TextInput
                        value={imageUrl}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            extraImageUrls: current.extraImageUrls.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          }))
                        }
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((current) => ({
                            ...current,
                            extraImageUrls:
                              current.extraImageUrls.length === 1
                                ? [""]
                                : current.extraImageUrls.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  NGN preview
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {money(toNumber(productForm.priceUsd, 0) * shippingSettings.exchangeRateNgnUsd, "NGN")}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Dialog.Close className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingProduct ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  {productForm.id ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white p-6 shadow-2xl">
            <Dialog.Title className="font-['Sora'] text-2xl font-semibold text-slate-950">
              Delete product?
            </Dialog.Title>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {deleteTarget?.name} will be removed from the admin product list. This action calls
              the live delete endpoint.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
