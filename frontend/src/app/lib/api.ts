import { defaultOrders, defaultProducts } from "../../data/storeData";
import { adminApiBaseUrl, publicAnonKey } from "./supabase-config";

export const ADMIN_TOKEN_STORAGE_KEY = "adminToken";

const LOCAL_MODE_TOKEN = "django-session";
const LOCAL_EXCHANGE_RATE_NGN_USD = 1545;
const LOCAL_STORAGE_KEYS = {
  orders: "sdg-admin-orders",
  products: "sdg-admin-products",
  shipping: "sdg-admin-shipping",
};

export class AdminApiError extends Error {
  code;

  hint;

  status;

  constructor(message, { code = "", hint = "", status = 500 } = {}) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.hint = hint;
    this.status = status;
  }
}

function readStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function isLocalAdminMode() {
  return !adminApiBaseUrl || !publicAnonKey;
}

function getCookie(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${name}=`;

  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return "";
}

function ensureConfigured() {
  if (isLocalAdminMode()) {
    throw new AdminApiError("Admin backend configuration is missing.", {
      code: "unconfigured",
      hint: "Add VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY to the frontend env.",
      status: 500,
    });
  }
}

function resolvePath(path) {
  ensureConfigured();
  return `${adminApiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getPayloadValue(payload, candidates) {
  for (const candidate of candidates) {
    const segments = candidate.split(".");
    let current = payload;

    for (const segment of segments) {
      if (current == null || typeof current !== "object" || !(segment in current)) {
        current = undefined;
        break;
      }
      current = current[segment];
    }

    if (current !== undefined && current !== null && current !== "") {
      return current;
    }
  }

  return undefined;
}

function getErrorCode(payload, status) {
  const raw =
    getPayloadValue(payload, ["code", "errorCode", "error_code", "error", "reason"]) ||
    (status === 401 ? "expired" : "");
  return String(raw || "").toLowerCase();
}

function getErrorMessage(payload, status) {
  return (
    getPayloadValue(payload, ["message", "error_description", "errorDescription", "detail", "error"]) ||
    (status === 401 ? "Your admin session is no longer valid." : `Request failed with status ${status}.`)
  );
}

function buildHeaders({ token, useJson = true, extraHeaders = {}, includeToken = true }) {
  const headers = new Headers(extraHeaders);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${publicAnonKey}`);

  if (useJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (includeToken) {
    const resolvedToken = token || getStoredAdminToken();
    if (resolvedToken) {
      headers.set("X-Admin-Token", resolvedToken);
    }
  }

  return headers;
}

function buildDjangoHeaders({ useJson = true, extraHeaders = {} }) {
  const headers = new Headers(extraHeaders);
  headers.set("Accept", "application/json");

  if (useJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const csrfToken = getCookie("csrftoken");
  if (csrfToken && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", csrfToken);
  }

  return headers;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    includeToken = true,
    headers: extraHeaders,
  } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(resolvePath(path), {
    method,
    headers: buildHeaders({
      token,
      useJson: !isFormData && body !== undefined,
      extraHeaders,
      includeToken,
    }),
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AdminApiError(getErrorMessage(payload, response.status), {
      code: getErrorCode(payload, response.status),
      hint: getPayloadValue(payload, ["hint", "data.hint"]) || "",
      status: response.status,
    });
  }

  return payload;
}

async function djangoRequest(path, options = {}) {
  const { method = "GET", body, headers: extraHeaders } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: buildDjangoHeaders({
      useJson: !isFormData && body !== undefined,
      extraHeaders,
    }),
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AdminApiError(getErrorMessage(payload, response.status), {
      code: getErrorCode(payload, response.status),
      hint: getPayloadValue(payload, ["hint", "data.hint"]) || "",
      status: response.status,
    });
  }

  return payload;
}

function defaultLocalProducts() {
  return defaultProducts.map((product) => ({
    id: product.id,
    slug: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    condition: product.condition,
    price_usd: product.priceUsd,
    stock_quantity: product.stock,
    description: product.description || product.shortDescription || "",
    image_url: product.image,
    extra_image_urls: (product.gallery || []).filter((imageUrl) => imageUrl !== product.image).slice(0, 3),
  }));
}

function defaultLocalOrders() {
  return defaultOrders.map((order) => {
    const itemNames = Array.isArray(order.items) ? order.items : [];
    const totalNgn = Math.round((Number(order.amountUsd) || 0) * LOCAL_EXCHANGE_RATE_NGN_USD);
    const unitPriceNgn = itemNames.length ? Math.round(totalNgn / itemNames.length) : totalNgn;

    return {
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customer,
      customer_email: order.email,
      status: order.status,
      created_at: new Date().toISOString(),
      total_ngn: totalNgn,
      items: itemNames.map((name, index) => ({
        id: `${order.id}-item-${index + 1}`,
        name,
        quantity: 1,
        unit_price_ngn: unitPriceNgn,
        line_total_ngn: unitPriceNgn,
      })),
      shipping_address: "Delivery address will appear after the customer completes checkout.",
      payment_method: "Paystack",
      paystack_reference: order.orderNumber,
      reference: order.orderNumber,
    };
  });
}

function defaultLocalShipping() {
  return {
    settings: {
      mode: "flat",
      value: 3500,
      freeThresholdEnabled: true,
      freeThreshold: 250000,
      exchangeRateNgnUsd: LOCAL_EXCHANGE_RATE_NGN_USD,
    },
  };
}

function readJsonStorage(key, fallbackFactory) {
  const storage = readStorage();

  if (!storage) {
    return cloneValue(fallbackFactory());
  }

  const stored = storage.getItem(key);
  if (!stored) {
    const fallbackValue = cloneValue(fallbackFactory());
    storage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }

  try {
    return JSON.parse(stored);
  } catch {
    const fallbackValue = cloneValue(fallbackFactory());
    storage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }
}

function writeJsonStorage(key, value) {
  readStorage()?.setItem(key, JSON.stringify(value));
  return value;
}

function resolveSessionPayload(payload) {
  const session =
    getPayloadValue(payload, ["session", "data.session", "admin", "data.admin", "user", "data.user"]) ||
    payload;

  return {
    email: getPayloadValue(session, ["email", "admin_email", "user.email", "username"]) || "",
    name:
      getPayloadValue(
        session,
        ["name", "full_name", "fullName", "display_name", "displayName", "username"],
      ) || "Admin",
    role:
      getPayloadValue(session, ["role", "admin_role"]) ||
      (getPayloadValue(session, ["isStaff"]) ? "staff" : "operator"),
  };
}

async function readLocalFileAsDataUrl(file) {
  if (typeof FileReader === "undefined") {
    throw new AdminApiError("This browser cannot preview uploaded images locally.", {
      code: "unsupported_upload",
      status: 500,
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(
        new AdminApiError("Could not read the selected image.", {
          code: "upload_failed",
          status: 500,
        }),
      );
    reader.readAsDataURL(file);
  });
}

export function isAdminApiConfigured() {
  return !isLocalAdminMode();
}

export function getStoredAdminToken() {
  return readStorage()?.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

export function setStoredAdminToken(token) {
  if (!token) {
    return;
  }

  readStorage()?.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAdminToken() {
  readStorage()?.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export async function loginAdmin({ email, password }) {
  if (isLocalAdminMode()) {
    const payload = await djangoRequest("/accounts/session/login/", {
      method: "POST",
      body: {
        email,
        username: email,
        password,
      },
    });

    if (!payload.isStaff) {
      throw new AdminApiError("This account does not have admin portal access.", {
        code: "incomplete_setup",
        status: 403,
      });
    }

    setStoredAdminToken(LOCAL_MODE_TOKEN);

    return {
      token: LOCAL_MODE_TOKEN,
      admin: resolveSessionPayload(payload),
    };
  }

  const payload = await request("/api/admin/login", {
    method: "POST",
    includeToken: false,
    body: {
      email,
      password,
    },
  });

  const token = getPayloadValue(payload, [
    "adminToken",
    "admin_token",
    "token",
    "data.adminToken",
    "data.admin_token",
    "data.token",
  ]);

  if (!token) {
    throw new AdminApiError("The admin backend did not return a session token.", {
      code: "missing_token",
      status: 500,
    });
  }

  setStoredAdminToken(String(token));

  return {
    token: String(token),
    admin: resolveSessionPayload(payload),
  };
}

export async function verifyAdminSession() {
  if (isLocalAdminMode()) {
    const payload = await djangoRequest("/session/status/");

    if (!payload.isAuthenticated) {
      throw new AdminApiError("No active admin session was found.", {
        code: "missing_token",
        status: 401,
      });
    }

    if (!payload.isStaff) {
      throw new AdminApiError("This account does not have admin portal access.", {
        code: "incomplete_setup",
        status: 403,
      });
    }

    setStoredAdminToken(LOCAL_MODE_TOKEN);

    return {
      token: LOCAL_MODE_TOKEN,
      admin: resolveSessionPayload(payload),
    };
  }

  const token = getStoredAdminToken();

  if (!token) {
    throw new AdminApiError("No stored admin token was found.", {
      code: "missing_token",
      status: 401,
    });
  }

  const payload = await request("/api/admin/session", {
    method: "GET",
    token,
  });

  return {
    token,
    admin: resolveSessionPayload(payload),
  };
}

export async function logoutAdmin() {
  if (isLocalAdminMode()) {
    try {
      await djangoRequest("/accounts/session/logout/", {
        method: "POST",
        body: {},
      });
    } finally {
      clearStoredAdminToken();
    }
    return;
  }

  clearStoredAdminToken();
}

export async function debugAdmin() {
  if (isLocalAdminMode()) {
    const payload = await djangoRequest("/session/status/");
    return {
      message: payload.isAuthenticated
        ? "Local admin mode is active and the Django session is valid."
        : "Local admin mode is enabled, but no active session was found.",
    };
  }

  return request("/api/admin/debug", { method: "GET" });
}

export async function fetchAdminOrders() {
  if (isLocalAdminMode()) {
    return readJsonStorage(LOCAL_STORAGE_KEYS.orders, defaultLocalOrders);
  }

  const payload = await request("/api/admin/orders", { method: "GET" });
  return getPayloadValue(payload, ["orders", "data.orders", "data", "results"]) || [];
}

export async function updateAdminOrder(orderId, status) {
  if (isLocalAdminMode()) {
    const orders = readJsonStorage(LOCAL_STORAGE_KEYS.orders, defaultLocalOrders).map((order) =>
      String(order.id) === String(orderId) ? { ...order, status } : order,
    );
    writeJsonStorage(LOCAL_STORAGE_KEYS.orders, orders);
    return { success: true, status };
  }

  return request(`/api/admin/orders/${orderId}`, {
    method: "PUT",
    body: { status },
  });
}

export async function fetchAdminProducts() {
  if (isLocalAdminMode()) {
    return readJsonStorage(LOCAL_STORAGE_KEYS.products, defaultLocalProducts);
  }

  const payload = await request("/api/admin/products", { method: "GET" });
  return getPayloadValue(payload, ["products", "data.products", "data", "results"]) || [];
}

export async function createAdminProduct(product) {
  if (isLocalAdminMode()) {
    const products = readJsonStorage(LOCAL_STORAGE_KEYS.products, defaultLocalProducts);
    products.unshift(product);
    writeJsonStorage(LOCAL_STORAGE_KEYS.products, products);
    return product;
  }

  return request("/api/admin/products", {
    method: "POST",
    body: product,
  });
}

export async function updateAdminProduct(productId, product) {
  if (isLocalAdminMode()) {
    const products = readJsonStorage(LOCAL_STORAGE_KEYS.products, defaultLocalProducts).map((entry) =>
      String(entry.id) === String(productId) || String(entry.slug) === String(productId)
        ? { ...entry, ...product, id: product.id || entry.id, slug: product.slug || entry.slug }
        : entry,
    );
    writeJsonStorage(LOCAL_STORAGE_KEYS.products, products);
    return product;
  }

  return request(`/api/admin/products/${productId}`, {
    method: "PUT",
    body: product,
  });
}

export async function deleteAdminProduct(productId) {
  if (isLocalAdminMode()) {
    const products = readJsonStorage(LOCAL_STORAGE_KEYS.products, defaultLocalProducts).filter(
      (entry) => String(entry.id) !== String(productId) && String(entry.slug) !== String(productId),
    );
    writeJsonStorage(LOCAL_STORAGE_KEYS.products, products);
    return { success: true };
  }

  return request(`/api/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export async function uploadAdminImage(file) {
  if (isLocalAdminMode()) {
    return readLocalFileAsDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);

  const payload = await request("/api/admin/upload-image", {
    method: "POST",
    body: formData,
  });

  const url = getPayloadValue(payload, ["url", "data.url", "imageUrl", "image_url"]);

  if (!url) {
    throw new AdminApiError("Image upload succeeded but no URL was returned.", {
      code: "missing_image_url",
      status: 500,
    });
  }

  return String(url);
}

export async function fetchAdminShipping() {
  if (isLocalAdminMode()) {
    return readJsonStorage(LOCAL_STORAGE_KEYS.shipping, defaultLocalShipping);
  }

  return request("/api/admin/shipping", { method: "GET" });
}

export async function updateAdminShipping(settings) {
  if (isLocalAdminMode()) {
    const nextValue = {
      settings: {
        mode: settings.mode || "flat",
        value: Number(settings.value) || 0,
        freeThresholdEnabled: Boolean(settings.freeThresholdEnabled),
        freeThreshold: Number(settings.freeThreshold) || 0,
        exchangeRateNgnUsd:
          Number(settings.exchangeRateNgnUsd) ||
          readJsonStorage(LOCAL_STORAGE_KEYS.shipping, defaultLocalShipping).settings
            .exchangeRateNgnUsd,
      },
    };
    writeJsonStorage(LOCAL_STORAGE_KEYS.shipping, nextValue);
    return nextValue;
  }

  return request("/api/admin/shipping", {
    method: "PUT",
    body: settings,
  });
}

export async function fetchAdminExchangeRate() {
  if (isLocalAdminMode()) {
    const shipping = readJsonStorage(LOCAL_STORAGE_KEYS.shipping, defaultLocalShipping);
    return { rate: shipping.settings.exchangeRateNgnUsd };
  }

  return request("/api/admin/settings/exchange-rate", { method: "GET" });
}

export async function updateAdminExchangeRate(rate) {
  if (isLocalAdminMode()) {
    const shipping = readJsonStorage(LOCAL_STORAGE_KEYS.shipping, defaultLocalShipping);
    const nextValue = {
      ...shipping,
      settings: {
        ...shipping.settings,
        exchangeRateNgnUsd: Number(rate) || shipping.settings.exchangeRateNgnUsd,
      },
    };
    writeJsonStorage(LOCAL_STORAGE_KEYS.shipping, nextValue);
    return { rate: nextValue.settings.exchangeRateNgnUsd };
  }

  return request("/api/admin/settings/exchange-rate", {
    method: "PUT",
    body: { rate },
  });
}
