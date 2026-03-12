import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import {
  AlertCircle,
  Activity,
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  EyeOff,
  GitMerge,
  ImagePlus,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  LogOut,
  Lock,
  Mail,
  Package,
  Pencil,
  Percent,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
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
  logoutAdmin,
  updateAdminExchangeRate,
  updateAdminOrder,
  updateAdminProduct,
  updateAdminShipping,
  uploadAdminImage,
  verifyAdminSession,
} from "../app/lib/api";
import { LoadingInlineLabel } from "../components/AppLoading";

const ORDER_TABS = [
  { value: "orders", label: "Orders", icon: Package },
  { value: "products", label: "Products", icon: Layers },
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
    copy: "No operator account is active for this portal yet. Create or provision the admin account locally, then return here and sign in.",
  },
  wrong_password: {
    title: "Incorrect Password",
    copy: "The email exists, but the password does not match. Reset the credential locally or update the backend secret, then try again.",
  },
  incomplete_setup: {
    title: "Setup Incomplete",
    copy: "The admin backend has not finished its local provisioning yet. Complete the setup locally before attempting another login.",
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
    pending: "border border-amber-500/25 bg-amber-500/15 text-amber-300",
    confirmed: "border border-blue-500/25 bg-blue-500/15 text-blue-300",
    shipped: "border border-purple-500/25 bg-purple-500/15 text-purple-300",
    delivered: "border border-cyan-500/25 bg-cyan-500/15 text-cyan-300",
    cancelled: "border border-rose-500/25 bg-rose-500/15 text-rose-300",
  }[normalizeOrderStatus(status)];
}

function statusLabel(status) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === normalizeOrderStatus(status))?.label || status;
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

function conditionTone(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("new")) {
    return "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300";
  }
  if (normalized.includes("like")) {
    return "border border-blue-500/25 bg-blue-500/15 text-blue-300";
  }
  if (normalized.includes("excellent")) {
    return "border border-purple-500/25 bg-purple-500/15 text-purple-300";
  }
  if (normalized.includes("good") || normalized.includes("fair") || normalized.includes("used")) {
    return "border border-amber-500/25 bg-amber-500/15 text-amber-300";
  }

  return "border border-white/15 bg-white/10 text-white/65";
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-gradient-to-br from-blue-600/25 to-purple-600/25 p-2 text-blue-300">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-white">{hint.title}</p>
          <p className="leading-6 text-white/55">{hint.copy}</p>
        </div>
      </div>
    </div>
  );
}

function PortalCard({ children, className = "" }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-[#111827] p-4 text-white shadow-[0_24px_80px_rgba(2,6,23,0.42)] backdrop-blur sm:p-6",
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
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-white/30">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={clsx(
        "min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
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
        "min-h-[140px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
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
        "min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
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
  const adminApiConfigured = isAdminApiConfigured();
  const [authState, setAuthState] = useState({
    checking: true,
    authenticated: false,
    admin: null,
  });
  const [activeTab, setActiveTab] = useState("orders");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
  const [orderSavingId, setOrderSavingId] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [shippingSettings, setShippingSettings] = useState(DEFAULT_SHIPPING_SETTINGS);
  const [exchangeRateDraft, setExchangeRateDraft] = useState(
    String(DEFAULT_SHIPPING_SETTINGS.exchangeRateNgnUsd),
  );
  const [shippingDraft, setShippingDraft] = useState(DEFAULT_SHIPPING_SETTINGS);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalRevenueNgn = orders.reduce((total, order) => total + toNumber(order.totalNgn, 0), 0);
  const orderStats = [
    {
      label: "Revenue",
      value: money(totalRevenueNgn, "NGN"),
      accent: "from-emerald-400 to-emerald-500",
      icon: BadgeDollarSign,
    },
    {
      label: "Confirmed",
      value: orders.filter((order) => normalizeOrderStatus(order.status) === "confirmed").length,
      accent: "from-blue-400 to-blue-500",
      icon: Shield,
    },
    {
      label: "Pending",
      value: orders.filter((order) => normalizeOrderStatus(order.status) === "pending").length,
      accent: "from-indigo-400 to-indigo-500",
      icon: Package,
    },
    {
      label: "In Route",
      value: orders.filter((order) => normalizeOrderStatus(order.status) === "shipped").length,
      accent: "from-purple-400 to-purple-500",
      icon: Truck,
    },
    {
      label: "Delivered",
      value: orders.filter((order) => normalizeOrderStatus(order.status) === "delivered").length,
      accent: "from-cyan-400 to-cyan-500",
      icon: Activity,
    },
    {
      label: "Total",
      value: orders.length,
      accent: "from-white/35 to-white/10",
      icon: Layers,
    },
  ];
  const filteredOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      [
        order.reference,
        order.customerName,
        order.customerEmail,
        order.paystackReference,
        order.itemsSummary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      orderFilter === "all" || normalizeOrderStatus(order.status) === orderFilter;

    return matchesQuery && matchesStatus;
  });
  const filteredProducts = products.filter((product) => {
    const query = productSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      [product.name, product.brand, product.description].join(" ").toLowerCase().includes(query);
    const matchesCategory =
      productCategoryFilter === "all" || product.category === productCategoryFilter;

    return matchesQuery && matchesCategory;
  });
  const shippingPreviewRows = [150000, 320000, 540000].map((subtotal) => {
    const subtotalValue = toNumber(subtotal, 0);
    let shippingAmount = 0;

    if (
      shippingDraft.freeThresholdEnabled &&
      subtotalValue >= toNumber(shippingDraft.freeThreshold, 0)
    ) {
      shippingAmount = 0;
    } else if (shippingDraft.mode === "percentage") {
      shippingAmount = subtotalValue * (toNumber(shippingDraft.value, 0) / 100);
    } else {
      shippingAmount = toNumber(shippingDraft.value, 0);
    }

    return {
      subtotal: subtotalValue,
      shipping: Math.round(shippingAmount),
      total: Math.round(subtotalValue + shippingAmount),
    };
  });

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
    if (adminApiConfigured && !getStoredAdminToken()) {
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

  async function logout() {
    await logoutAdmin();
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
    setOrderSavingId(orderId);

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );

    try {
      await updateAdminOrder(orderId, nextStatus);
      toast.success("Order status updated.");
    } catch (error) {
      setOrders(previous);
      toast.error(error.message || "Could not update order status.");
    } finally {
      setOrderSavingId("");
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
    setDeleteSubmitting(true);
    setProducts((current) => current.filter((product) => product.id !== deleteTarget.id));

    try {
      await deleteAdminProduct(deleteTarget.id);
      toast.success("Product deleted.");
    } catch (error) {
      setProducts(previous);
      toast.error(error.message || "Could not delete product.");
    } finally {
      setDeleteTarget(null);
      setDeleteSubmitting(false);
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
          <PortalCard className="w-full max-w-xl bg-[#111827] p-10 text-center text-white shadow-[0_32px_120px_rgba(2,6,23,0.45)]">
            <div className="mx-auto inline-flex rounded-3xl bg-white/5 p-4 text-blue-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-blue-300">
              Secure Admin Portal
            </p>
            <h1 className="mt-3 font-['Sora'] text-4xl font-semibold">Verifying operator session</h1>
            <p className="mt-4 text-sm leading-7 text-white/55">
              Checking for a valid admin session and loading SirDavid Gadgets operations.
            </p>
          </PortalCard>
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] px-4 py-10 text-white">
        <PortalCard className="w-full max-w-[420px] rounded-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-[0_18px_40px_rgba(59,130,246,0.22)]">
              <Shield className="h-5 w-5 text-white" />
            </span>
            <h1 className="mt-5 font-['Sora'] text-3xl font-semibold text-white">Admin Portal</h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.38em] text-white/40">
              SIRDAVID MULTI-TRADE LTD
            </p>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <form onSubmit={submitLogin} className="space-y-5">
              <Field label="Email address or username">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <TextInput
                    type="text"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="admin@sirdavid.site or sirdavid"
                    autoComplete="username"
                    className="pl-11"
                    required
                  />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    className="pl-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {authError ? (
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {authError.message}
                </div>
              ) : null}

              {!adminApiConfigured ? (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                  Local admin mode is active. Sign in with the Django staff account provisioned for
                  this store.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submittingAuth}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <LoadingInlineLabel
                  loading={submittingAuth}
                  idleLabel="Sign In to Dashboard"
                  loadingLabel="Authenticating..."
                  minWidthClass="min-w-[170px]"
                />
              </button>
            </form>

            <div className="mt-5 space-y-3">
              <LoginHintCard error={authError} />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            Protected by secure authentication · SIRDAVID MULTI-TRADE LTD
          </p>
        </PortalCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0b0f1a]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-[0_18px_40px_rgba(59,130,246,0.22)]">
              <Shield className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-['Sora'] text-lg font-semibold text-white">SirDavid</p>
              <p className="text-[11px] font-medium text-white/40">
                Admin
              </p>
            </div>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="order-3 w-full md:order-none md:min-w-0 md:flex-1">
            <div className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
              <Tabs.List className="mx-auto flex w-max min-w-full items-center gap-2 rounded-xl bg-transparent p-0 md:w-fit md:min-w-0">
              {ORDER_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Tabs.Trigger>
                );
              })}
              </Tabs.List>
            </div>
          </Tabs.Root>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runDebugCheck}
              disabled={debugging}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-60 md:h-10 md:w-auto md:gap-2 md:px-3"
            >
              {debugging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              <span className="hidden sm:inline">Debug</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-rose-400 md:h-10 md:w-auto md:gap-2 md:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/35">
                Authenticated operator
              </p>
              <h1 className="mt-2 font-['Sora'] text-3xl font-semibold text-white">
                Welcome back, {authState.admin?.name || "Admin"}.
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-white/60">
                {authState.admin?.email || authState.admin?.name}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 capitalize text-white/60">
                {authState.admin?.role || "operator"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {orderStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <PortalCard key={stat.label} className="relative overflow-hidden p-4">
                  <div className={clsx("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", stat.accent)} />
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/45">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">{stat.label}</p>
                  </div>
                  <p className="mt-4 font-['Sora'] text-2xl font-semibold text-white">{stat.value}</p>
                </PortalCard>
              );
            })}
          </div>
        </section>

        {dashboardLoading ? (
          <PortalCard className="flex items-center justify-center gap-3 py-20 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            Loading live admin data...
          </PortalCard>
        ) : null}

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.Content value="orders" className="space-y-5">
            <PortalCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                    Orders
                  </p>
                  <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-white">
                    Verified order dashboard
                  </h2>
                </div>
                <p className="text-sm text-white/30">{filteredOrders.length} results</p>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <Shield className="h-4 w-4" />
                Payment-confirmed orders and shipping updates are managed from this queue.
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 flex-col gap-4 lg:flex-row">
                    <div className="relative w-full lg:max-w-md">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <TextInput
                        value={orderSearch}
                        onChange={(event) => setOrderSearch(event.target.value)}
                        placeholder="Search reference, customer, email, or payment ref"
                        className="pl-11"
                      />
                    </div>
                    <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1">
                      {[{ value: "all", label: "All" }, ...ORDER_STATUS_OPTIONS].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setOrderFilter(option.value)}
                          className={clsx(
                            "rounded-full border px-4 py-2 text-sm transition",
                            orderFilter === option.value
                              ? "border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "border-white/15 text-white/50 hover:border-blue-500/50 hover:text-blue-400",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadOrders()}
                    disabled={ordersLoading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
                  >
                    {ordersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                    <LoadingInlineLabel
                      loading={ordersLoading}
                      idleLabel="Refresh"
                      loadingLabel="Refreshing..."
                      minWidthClass="min-w-[108px]"
                    />
                  </button>
                </div>
              </div>

              {!filteredOrders.length ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                    <Package className="h-7 w-7 text-white/20" />
                  </div>
                  <h3 className="mt-4 font-['Sora'] text-2xl font-semibold text-white">
                    No orders to display
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/30">
                    Adjust the current filters or wait for new orders to arrive from the admin API.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4 md:hidden">
                    {filteredOrders.map((order) => {
                      const expanded = expandedOrderId === order.id;
                      return (
                        <article
                          key={order.id}
                          className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId((current) => (current === order.id ? "" : order.id))
                            }
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="space-y-1">
                              <p className="font-mono text-sm font-semibold text-blue-400">{order.reference}</p>
                              <p className="text-sm text-white">{order.customerName}</p>
                              <p className="text-sm text-white/40">{order.customerEmail}</p>
                              <p className="text-xs text-white/30">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={clsx(
                                  "inline-flex rounded-full px-3 py-1 text-sm font-semibold",
                                  statusTone(order.status),
                                )}
                              >
                                {statusLabel(order.status)}
                              </span>
                              <span className="text-sm font-semibold text-white">
                                {money(order.totalNgn, "NGN")}
                              </span>
                            </div>
                          </button>

                          <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Items</p>
                              <p className="mt-2 text-sm leading-6 text-white/75">{order.itemsSummary}</p>
                            </div>
                            <div className="grid gap-3">
                              <SelectInput
                                value={orderStatusDrafts[order.id] || order.status}
                                onChange={(event) =>
                                  setOrderStatusDrafts((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                options={ORDER_STATUS_OPTIONS}
                              />
                              <button
                                type="button"
                                onClick={() => persistOrderStatus(order.id)}
                                disabled={orderSavingId === order.id}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                              >
                                <LoadingInlineLabel
                                  loading={orderSavingId === order.id}
                                  idleLabel="Update status"
                                  loadingLabel="Saving..."
                                  minWidthClass="min-w-[120px]"
                                />
                              </button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="mt-4 grid gap-4">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Item breakdown</p>
                                <div className="mt-3 space-y-3">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3"
                                    >
                                      <p className="font-medium text-white">{item.name}</p>
                                      <p className="mt-1 text-sm text-white/40">
                                        Qty {item.quantity} · {money(item.unitPriceNgn, "NGN")} each
                                      </p>
                                      <p className="mt-2 text-sm font-semibold text-white">
                                        {money(item.lineTotalNgn, "NGN")}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Shipping address</p>
                                <p className="mt-3 text-sm leading-7 text-white/75">
                                  {order.shippingAddress}
                                </p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Payment details</p>
                                <dl className="mt-3 space-y-3 text-sm text-white/60">
                                  <div className="flex items-center justify-between gap-4">
                                    <dt>Method</dt>
                                    <dd className="font-semibold text-white">{order.paymentMethod}</dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <dt>Paystack ref</dt>
                                    <dd className="truncate text-right font-mono text-xs font-semibold text-blue-400">
                                      {order.paystackReference}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.24em] text-white/40">
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
                        {filteredOrders.map((order) => {
                          const expanded = expandedOrderId === order.id;
                          return (
                            <Fragment key={order.id}>
                              <tr
                                onClick={() =>
                                  setExpandedOrderId((current) =>
                                    current === order.id ? "" : order.id,
                                  )
                                }
                                className="cursor-pointer border-t border-white/5 transition hover:bg-white/5"
                              >
                                <td className="px-4 py-4 font-semibold text-blue-400">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs">{order.reference}</span>
                                    {expanded ? (
                                      <ChevronUp className="h-4 w-4 text-white/30" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-white/30" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="font-medium text-white">{order.customerName}</p>
                                  <p className="mt-1 text-xs text-white/40">{order.customerEmail}</p>
                                </td>
                                <td className="max-w-[260px] px-4 py-4 text-white/60">
                                  <span className="line-clamp-2">{order.itemsSummary}</span>
                                </td>
                                <td className="px-4 py-4 font-semibold text-white">
                                  {money(order.totalNgn, "NGN")}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={clsx(
                                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                      statusTone(order.status),
                                    )}
                                  >
                                    {statusLabel(order.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-white/40">{formatDate(order.createdAt)}</td>
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
                                      disabled={orderSavingId === order.id}
                                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                                    >
                                      <LoadingInlineLabel
                                        loading={orderSavingId === order.id}
                                        idleLabel="Update"
                                        loadingLabel="Saving..."
                                        minWidthClass="min-w-[84px]"
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expanded ? (
                                <tr className="border-t border-white/10 bg-white/[0.03]">
                                  <td colSpan={7} className="px-5 py-5">
                                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                                      <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                                          Item breakdown
                                        </p>
                                        <div className="mt-4 space-y-3">
                                          {order.items.map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                            >
                                              <div>
                                                <p className="font-medium text-white">{item.name}</p>
                                                <p className="text-xs text-white/40">
                                                  Qty {item.quantity} · {money(item.unitPriceNgn, "NGN")} each
                                                </p>
                                              </div>
                                              <p className="font-semibold text-white">
                                                {money(item.lineTotalNgn, "NGN")}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                                            Shipping address
                                          </p>
                                          <p className="mt-3 text-sm leading-7 text-white/75">
                                            {order.shippingAddress}
                                          </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                                            Payment details
                                          </p>
                                          <dl className="mt-3 space-y-3 text-sm text-white/60">
                                            <div className="flex items-center justify-between gap-4">
                                              <dt>Method</dt>
                                              <dd className="font-semibold text-white">{order.paymentMethod}</dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                              <dt>Paystack ref</dt>
                                              <dd className="font-mono text-xs font-semibold text-blue-400">
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
                </>
              )}
            </PortalCard>
          </Tabs.Content>

          <Tabs.Content value="products" className="space-y-5">
            <PortalCard>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                      Exchange rate
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      Update the NGN preview baseline used throughout the product manager.
                    </p>
                  </div>
                  <form onSubmit={saveExchangeRate} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <TextInput
                      type="number"
                      min="1"
                      step="0.01"
                      value={exchangeRateDraft}
                      onChange={(event) => setExchangeRateDraft(event.target.value)}
                      className="sm:min-w-[220px]"
                    />
                    <button
                      type="submit"
                      disabled={exchangeSaving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                    >
                      {exchangeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeDollarSign className="h-4 w-4" />}
                      <LoadingInlineLabel
                        loading={exchangeSaving}
                        idleLabel="Save Rate"
                        loadingLabel="Saving..."
                        minWidthClass="min-w-[110px]"
                      />
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                    Products
                  </p>
                  <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-white">
                    Catalog manager
                  </h2>
                </div>
                <p className="text-sm text-white/30">{filteredProducts.length} products</p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 flex-col gap-4 lg:flex-row">
                    <div className="relative w-full lg:max-w-md">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <TextInput
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        placeholder="Search by name, brand, or description"
                        className="pl-11"
                      />
                    </div>
                    <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1">
                      {[{ value: "all", label: "All" }, ...PRODUCT_CATEGORY_OPTIONS].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProductCategoryFilter(option.value)}
                          className={clsx(
                            "rounded-full border px-4 py-2 text-sm transition",
                            productCategoryFilter === option.value
                              ? "border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "border-white/15 text-white/50 hover:border-blue-500/50 hover:text-blue-400",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={() => loadProducts()}
                      disabled={productsLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
                    >
                      {productsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                      <LoadingInlineLabel
                        loading={productsLoading}
                        idleLabel="Refresh"
                        loadingLabel="Refreshing..."
                        minWidthClass="min-w-[108px]"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={openCreateProduct}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Product
                    </button>
                  </div>
                </div>
              </div>

              {!filteredProducts.length ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                    <ShoppingBag className="h-7 w-7 text-white/20" />
                  </div>
                  <h3 className="mt-4 font-['Sora'] text-2xl font-semibold text-white">
                    No products loaded
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/30">
                    Create your first catalog entry or adjust the current category and search filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:hidden">
                    {filteredProducts.map((product) => (
                      <article key={product.id} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                        <div className="flex gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-white/20" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-medium text-white">{product.name}</p>
                            <p className="mt-1 text-sm text-white/40">{product.brand}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
                                {PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === product.category)?.label || product.category}
                              </span>
                              <span className={clsx("rounded-full px-2.5 py-1 text-xs", conditionTone(product.condition))}>
                                {product.condition}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">NGN</p>
                            <p className="mt-2 font-semibold text-white">{money(product.priceNgn, "NGN")}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">USD</p>
                            <p className="mt-2 font-semibold text-white/70">{money(product.priceUsd, "USD")}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Stock</p>
                            <p className="mt-2 font-semibold text-white">{product.stock}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Extras</p>
                            <p className="mt-2 font-semibold text-white">{product.extraImageUrls.length}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-rose-400/70 transition hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.24em] text-white/40">
                          <tr>
                            <th className="px-4 py-4">Product</th>
                            <th className="px-4 py-4">Category</th>
                            <th className="px-4 py-4">Condition</th>
                            <th className="px-4 py-4">Price</th>
                            <th className="px-4 py-4">Stock</th>
                            <th className="px-4 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <tr key={product.id} className="border-t border-white/5 transition hover:bg-white/5">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <ImageIcon className="h-4 w-4 text-white/20" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{product.name}</p>
                                    <p className="mt-1 text-xs text-white/40">{product.brand}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
                                  {PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === product.category)?.label || product.category}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={clsx("rounded-full px-2.5 py-1 text-xs", conditionTone(product.condition))}>
                                  {product.condition}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-semibold text-white">{money(product.priceNgn, "NGN")}</p>
                                <p className="mt-1 text-xs text-white/40">{money(product.priceUsd, "USD")}</p>
                              </td>
                              <td className="px-4 py-4 font-semibold text-white">{product.stock}</td>
                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditProduct(product)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(product)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-400/70 transition hover:bg-rose-500/10 hover:text-rose-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </PortalCard>
          </Tabs.Content>

          <Tabs.Content value="shipping" className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <PortalCard>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                  Current settings
                </p>
                <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-white">
                  Shipping configuration
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">Mode</p>
                    <p className="mt-2 font-semibold text-white">
                      {SHIPPING_MODE_OPTIONS.find((option) => option.value === shippingSettings.mode)
                        ?.label || shippingSettings.mode}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">Value</p>
                    <p className="mt-2 font-semibold text-white">
                      {shippingSettings.mode === "percentage"
                        ? `${shippingSettings.value}%`
                        : money(shippingSettings.value, "NGN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                      Free threshold
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {shippingSettings.freeThresholdEnabled
                        ? money(shippingSettings.freeThreshold, "NGN")
                        : "Disabled"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">Live preview</p>
                  </div>
                  <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-[0.24em] text-white/40">
                        <tr>
                          <th className="px-5 py-4">Subtotal</th>
                          <th className="px-5 py-4">Shipping</th>
                          <th className="px-5 py-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shippingPreviewRows.map((row) => (
                          <tr key={row.subtotal} className="border-t border-white/5 hover:bg-white/5">
                            <td className="px-5 py-4 text-white/70">{money(row.subtotal, "NGN")}</td>
                            <td className="px-5 py-4">
                              {row.shipping === 0 ? (
                                <span className="font-medium text-emerald-400">FREE</span>
                              ) : (
                                <span className="text-amber-300">{money(row.shipping, "NGN")}</span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-semibold text-white">{money(row.total, "NGN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PortalCard>

              <PortalCard>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                  Shipping editor
                </p>
                <h2 className="mt-2 font-['Sora'] text-2xl font-semibold text-white">
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
                          "min-h-11 rounded-xl border px-4 py-4 text-left transition",
                          shippingDraft.mode === option.value
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                            {option.value === "flat" ? (
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                            ) : option.value === "percentage" ? (
                              <Percent className="h-4 w-4 text-blue-400" />
                            ) : (
                              <GitMerge className="h-4 w-4 text-purple-400" />
                            )}
                          </span>
                          <p className="font-semibold text-white">{option.label}</p>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-white/40">
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

                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
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
                    <span className="text-sm font-medium text-white/70">
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

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-300">Formula preview</p>
                        <p className="mt-2 font-mono text-xs text-blue-200/80">
                          {shippingDraft.mode === "percentage"
                            ? "shipping = subtotal * (rate / 100)"
                            : "shipping = flat fee until free threshold applies"}
                        </p>
                        {shippingDraft.freeThresholdEnabled ? (
                          <p className="mt-2 text-xs text-emerald-400">
                            Free shipping activates at {money(toNumber(shippingDraft.freeThreshold, 0), "NGN")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={shippingSaving}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                  >
                    {shippingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    <LoadingInlineLabel
                      loading={shippingSaving}
                      idleLabel="Save Settings"
                      loadingLabel="Saving..."
                      minWidthClass="min-w-[132px]"
                    />
                  </button>
                </form>

                <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
                    Exchange rate manager
                  </p>
                  <h3 className="mt-2 font-['Sora'] text-xl font-semibold text-white">
                    Current NGN / USD rate
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/40">
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
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                    >
                      {exchangeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeDollarSign className="h-4 w-4" />}
                      <LoadingInlineLabel
                        loading={exchangeSaving}
                        idleLabel="Update Rate"
                        loadingLabel="Saving..."
                        minWidthClass="min-w-[126px]"
                      />
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
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-[#111827] p-4 text-white shadow-2xl sm:right-0 sm:left-auto sm:top-0 sm:max-w-3xl sm:border-l sm:border-white/10 sm:p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                  {productForm.id ? "Edit product" : "Add product"}
                </p>
                <Dialog.Title className="mt-2 font-['Sora'] text-2xl font-semibold text-white md:text-3xl">
                  {productForm.id ? "Update catalog entry" : "Create new catalog entry"}
                </Dialog.Title>
              </div>
              <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white">
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

              <PortalCard className="border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Primary image</p>
                    <p className="mt-1 text-sm text-white/40">
                      Upload a file to the admin backend or paste a hosted URL.
                    </p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500">
                    {uploadingImage ? null : <ImagePlus className="h-4 w-4" />}
                    <LoadingInlineLabel
                      loading={uploadingImage}
                      idleLabel="Upload image"
                      loadingLabel="Uploading..."
                      minWidthClass="min-w-[126px]"
                    />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageUpload} />
                  </label>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {productForm.imageUrl ? (
                      <img
                        src={productForm.imageUrl}
                        alt={productForm.name || "Product preview"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-white/25">
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

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Additional image URLs</p>
                    <p className="mt-1 text-sm text-white/40">Add up to three extra image URLs.</p>
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
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/15 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/25"
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
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b0f1a] px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                  NGN preview
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {money(toNumber(productForm.priceUsd, 0) * shippingSettings.exchangeRateNgnUsd, "NGN")}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Dialog.Close className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                >
                  {savingProduct ? null : <ShoppingBag className="h-4 w-4" />}
                  <LoadingInlineLabel
                    loading={savingProduct}
                    idleLabel={productForm.id ? "Save changes" : "Create product"}
                    loadingLabel="Saving..."
                    minWidthClass="min-w-[140px]"
                  />
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-white/10 bg-[#111827] p-6 text-white shadow-2xl sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <Dialog.Title className="font-['Sora'] text-2xl font-semibold text-white">
              Delete product?
            </Dialog.Title>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {deleteTarget?.name} will be removed from the admin product list. This action calls
              the live delete endpoint.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Dialog.Close className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={deleteSubmitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-70"
              >
                {deleteSubmitting ? null : <Trash2 className="h-4 w-4" />}
                <LoadingInlineLabel
                  loading={deleteSubmitting}
                  idleLabel="Delete"
                  loadingLabel="Deleting..."
                  minWidthClass="min-w-[96px]"
                />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
