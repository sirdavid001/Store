import { adminApiBaseUrl, publicAnonKey } from "./supabase-config";

export const ADMIN_TOKEN_STORAGE_KEY = "adminToken";

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

function ensureConfigured() {
  if (!adminApiBaseUrl || !publicAnonKey) {
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
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
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

function resolveSessionPayload(payload) {
  const session =
    getPayloadValue(payload, ["session", "data.session", "admin", "data.admin", "user", "data.user"]) ||
    payload;

  return {
    email: getPayloadValue(session, ["email", "admin_email", "user.email"]) || "",
    name:
      getPayloadValue(session, ["name", "full_name", "fullName", "display_name", "displayName"]) ||
      "Admin",
    role: getPayloadValue(session, ["role", "admin_role"]) || "operator",
  };
}

export function isAdminApiConfigured() {
  return Boolean(adminApiBaseUrl && publicAnonKey);
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

export async function debugAdmin() {
  return request("/api/admin/debug", { method: "GET" });
}

export async function fetchAdminOrders() {
  const payload = await request("/api/admin/orders", { method: "GET" });
  return getPayloadValue(payload, ["orders", "data.orders", "data", "results"]) || [];
}

export async function updateAdminOrder(orderId, status) {
  return request(`/api/admin/orders/${orderId}`, {
    method: "PUT",
    body: { status },
  });
}

export async function fetchAdminProducts() {
  const payload = await request("/api/admin/products", { method: "GET" });
  return getPayloadValue(payload, ["products", "data.products", "data", "results"]) || [];
}

export async function createAdminProduct(product) {
  return request("/api/admin/products", {
    method: "POST",
    body: product,
  });
}

export async function updateAdminProduct(productId, product) {
  return request(`/api/admin/products/${productId}`, {
    method: "PUT",
    body: product,
  });
}

export async function deleteAdminProduct(productId) {
  return request(`/api/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export async function uploadAdminImage(file) {
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
  return request("/api/admin/shipping", { method: "GET" });
}

export async function updateAdminShipping(settings) {
  return request("/api/admin/shipping", {
    method: "PUT",
    body: settings,
  });
}

export async function fetchAdminExchangeRate() {
  return request("/api/admin/settings/exchange-rate", { method: "GET" });
}

export async function updateAdminExchangeRate(rate) {
  return request("/api/admin/settings/exchange-rate", {
    method: "PUT",
    body: { rate },
  });
}

export async function setupAdminFirstTime(payload) {
  return request("/api/admin/setup-first-time", {
    method: "POST",
    includeToken: false,
    body: payload,
  });
}
