import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import {
  currencyOptions,
  defaultOrders,
  defaultPaymentLogs,
  defaultProducts,
  defaultShippingConfig,
} from "../data/storeData";

const FALLBACK_RATES = {
  USD: 1,
  NGN: 1545,
  GHS: 15.4,
  KES: 129.8,
  ZAR: 18.9,
  XOF: 610.5,
};

const COUNTRY_TO_CURRENCY = {
  NG: "NGN",
  US: "USD",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  BJ: "XOF",
  BF: "XOF",
  CI: "XOF",
  ML: "XOF",
  NE: "XOF",
  SN: "XOF",
  TG: "XOF",
};

const STORAGE_KEYS = {
  cart: "sirdavid-cart",
  products: "sirdavid-products",
  orders: "sirdavid-orders",
  shipping: "sirdavid-shipping",
  logs: "sirdavid-payments",
  currency: "sirdavid-currency",
};

function getCookie(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const target = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : "";
}

const StoreContext = createContext(null);

function readStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function inferCountryFromLocale() {
  try {
    const locale = new Intl.Locale(navigator.language);
    return locale.region ?? "NG";
  } catch {
    const parts = navigator.language.split("-");
    return parts[1] ?? "NG";
  }
}

async function detectCountry() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      throw new Error("country lookup failed");
    }

    const payload = await response.json();
    return payload.country_code ?? inferCountryFromLocale();
  } catch {
    return inferCountryFromLocale();
  }
}

async function fetchRates() {
  const endpoint = import.meta.env.VITE_EXCHANGE_RATES_URL || "https://open.er-api.com/v6/latest/USD";

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error("rates lookup failed");
    }

    const payload = await response.json();
    const rates = payload.rates ?? payload.conversion_rates ?? {};

    return {
      ...FALLBACK_RATES,
      ...Object.fromEntries(
        Object.entries(rates).filter(([code]) => Object.hasOwn(FALLBACK_RATES, code)),
      ),
    };
  } catch {
    return FALLBACK_RATES;
  }
}

function buildPriceFormatter(currency) {
  const meta = currencyOptions.find((option) => option.value === currency) ?? currencyOptions[0];

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  });
}

function getCurrencyLabel(code) {
  return currencyOptions.find((option) => option.value === code)?.label ?? code;
}

function getShippingCostUsd(subtotalUsd, shippingConfig) {
  if (shippingConfig.mode === "percentage") {
    return subtotalUsd * (shippingConfig.percentageRate / 100);
  }

  if (shippingConfig.mode === "free-threshold") {
    return subtotalUsd >= shippingConfig.freeThresholdUsd ? 0 : shippingConfig.flatFeeUsd;
  }

  return shippingConfig.flatFeeUsd;
}

function normalizeSessionStatus(payload) {
  return {
    loading: false,
    isAuthenticated: Boolean(payload.isAuthenticated),
    isStaff: Boolean(payload.isStaff),
    username: payload.username ?? "",
    displayName: payload.displayName ?? payload.username ?? "",
    loginUrl: payload.loginUrl || "/accounts/login/",
    logoutUrl: payload.logoutUrl || "/accounts/logout/",
  };
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => readStorage(STORAGE_KEYS.products, defaultProducts));
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart, []));
  const [orders, setOrders] = useState(() => readStorage(STORAGE_KEYS.orders, defaultOrders));
  const [shippingConfig, setShippingConfig] = useState(() =>
    readStorage(STORAGE_KEYS.shipping, defaultShippingConfig),
  );
  const [paymentLogs, setPaymentLogs] = useState(() =>
    readStorage(STORAGE_KEYS.logs, defaultPaymentLogs),
  );
  const [currentCurrency, setCurrentCurrency] = useState(() =>
    readStorage(STORAGE_KEYS.currency, "NGN"),
  );
  const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES);
  const [loadingRates, setLoadingRates] = useState(true);
  const [lastRateSync, setLastRateSync] = useState(null);
  const [sessionStatus, setSessionStatus] = useState({
    loading: true,
    isAuthenticated: false,
    isStaff: false,
    username: "",
    displayName: "",
    loginUrl: "/accounts/login/",
    logoutUrl: "/accounts/logout/",
  });

  async function refreshSessionStatus() {
    const endpoint = import.meta.env.VITE_SESSION_STATUS_ENDPOINT || "/session/status/";
    const response = await fetch(endpoint, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("session status lookup failed");
    }

    const payload = await response.json();
    const normalized = normalizeSessionStatus(payload);
    setSessionStatus(normalized);
    return normalized;
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.shipping, JSON.stringify(shippingConfig));
  }, [shippingConfig]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(paymentLogs));
  }, [paymentLogs]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.currency, JSON.stringify(currentCurrency));
  }, [currentCurrency]);

  useEffect(() => {
    let active = true;

    async function loadSessionStatus() {
      try {
        await refreshSessionStatus();
        if (!active) {
          return;
        }
      } catch {
        if (!active) {
          return;
        }

        setSessionStatus((current) => ({
          ...current,
          loading: false,
        }));
      }
    }

    loadSessionStatus();

    return () => {
      active = false;
    };
  }, []);

  async function adminLogin(credentials) {
    const endpoint = import.meta.env.VITE_ADMIN_LOGIN_ENDPOINT || "/accounts/session/login/";
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Could not sign in.");
    }

    const normalized = normalizeSessionStatus(payload);
    setSessionStatus(normalized);
    return normalized;
  }

  async function adminLogout() {
    const endpoint = import.meta.env.VITE_ADMIN_LOGOUT_ENDPOINT || "/accounts/session/logout/";
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        Accept: "application/json",
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Could not sign out.");
    }

    const normalized = normalizeSessionStatus(payload);
    setSessionStatus(normalized);
    return normalized;
  }

  useEffect(() => {
    let active = true;

    async function bootstrapRegionalPricing() {
      const [countryCode, rates] = await Promise.all([detectCountry(), fetchRates()]);
      if (!active) {
        return;
      }

      setExchangeRates(rates);
      setLastRateSync(new Date().toISOString());
      setLoadingRates(false);

      const stored = readStorage(STORAGE_KEYS.currency, null);
      if (!stored) {
        setCurrentCurrency(COUNTRY_TO_CURRENCY[countryCode] ?? "USD");
      }
    }

    bootstrapRegionalPricing();

    return () => {
      active = false;
    };
  }, []);

  const cartLines = cart
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      if (!product) {
        return null;
      }

      return {
        ...product,
        quantity: entry.quantity,
        lineTotalUsd: product.priceUsd * entry.quantity,
      };
    })
    .filter(Boolean);

  const cartCount = cartLines.reduce((total, item) => total + item.quantity, 0);
  const subtotalUsd = cartLines.reduce((total, item) => total + item.lineTotalUsd, 0);
  const shippingUsd = getShippingCostUsd(subtotalUsd, shippingConfig);
  const totalUsd = subtotalUsd + shippingUsd;

  function formatPrice(amountUsd, currency = currentCurrency) {
    const rate = exchangeRates[currency] ?? 1;
    return buildPriceFormatter(currency).format(amountUsd * rate);
  }

  function setCurrency(nextCurrency) {
    setCurrentCurrency(nextCurrency);
    toast.success(`Showing prices in ${getCurrencyLabel(nextCurrency)}.`);
  }

  function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { productId, quantity: 1 }];
    });

    toast.success(`${product.name} added to cart.`);
  }

  function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  }

  function removeFromCart(productId) {
    const product = products.find((item) => item.id === productId);
    setCart((current) => current.filter((item) => item.productId !== productId));
    if (product) {
      toast.message(`${product.name} removed from cart.`);
    }
  }

  function clearCart() {
    setCart([]);
  }

  async function beginHostedCheckout(checkoutDetails) {
    if (!cartLines.length) {
      toast.error("Your cart is empty.");
      return;
    }

    try {
      const endpoint =
        import.meta.env.VITE_PAYSTACK_INIT_ENDPOINT || "/payments/storefront/initialize/";
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
          Accept: "application/json",
        },
        body: JSON.stringify({
          customer: checkoutDetails.customer,
          address: checkoutDetails.address,
          payment_method: checkoutDetails.paymentMethod,
          display_currency: currentCurrency,
          items: cartLines.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "checkout initialization failed");
      }
      const redirectUrl = payload.authorization_url ?? payload.data?.authorization_url;

      if (!redirectUrl) {
        throw new Error("missing authorization url");
      }

      setPaymentLogs((current) => [
        {
          id: payload.reference,
          reference: payload.reference,
          orderNumber: "Pending webhook confirmation",
          status: "initialized",
          channel: checkoutDetails.paymentMethod,
          createdAt: new Date().toISOString(),
          amountUsd: totalUsd,
        },
        ...current,
      ]);

      window.location.assign(redirectUrl);
    } catch (error) {
      toast.error(error.message || "Could not initialize Paystack checkout.");
    }
  }

  function upsertProduct(productInput) {
    startTransition(() => {
      setProducts((current) => {
        const payload = {
          ...productInput,
          priceUsd: Number(productInput.priceUsd),
          stock: Number(productInput.stock),
        };

        const exists = current.some((item) => item.id === payload.id);
        if (exists) {
          return current.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
        }

        return [payload, ...current];
      });
    });

    toast.success("Product saved.");
  }

  function deleteProduct(productId) {
    startTransition(() => {
      setProducts((current) => current.filter((item) => item.id !== productId));
      setCart((current) => current.filter((item) => item.productId !== productId));
    });

    toast.message("Product deleted.");
  }

  function updateOrderStatus(orderId, nextStatus) {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );
    toast.success(`Order status updated to ${nextStatus}.`);
  }

  function updateShipping(nextConfig) {
    setShippingConfig({
      ...nextConfig,
      flatFeeUsd: Number(nextConfig.flatFeeUsd),
      percentageRate: Number(nextConfig.percentageRate),
      freeThresholdUsd: Number(nextConfig.freeThresholdUsd),
    });
    toast.success("Shipping rules updated.");
  }

  const value = {
    products,
    cartLines,
    cartCount,
    subtotalUsd,
    shippingUsd,
    totalUsd,
    orders,
    paymentLogs,
    shippingConfig,
    currentCurrency,
    exchangeRates,
    loadingRates,
    lastRateSync,
    sessionStatus,
    adminLogin,
    adminLogout,
    refreshSessionStatus,
    currencyOptions,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    beginHostedCheckout,
    formatPrice,
    setCurrency,
    upsertProduct,
    deleteProduct,
    updateOrderStatus,
    updateShipping,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }

  return context;
}
