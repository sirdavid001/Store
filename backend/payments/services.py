import hashlib
import hmac
import logging
import secrets
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from catalog.models import Product

from .storefront_catalog import STOREFRONT_PRODUCT_CATALOG, STOREFRONT_SHIPPING_FEE_USD

logger = logging.getLogger(__name__)

CHECKOUT_CACHE_PREFIX = "checkout-draft"
PAYMENT_STATUS_PREFIX = "payment-status"
TWOPLACES = Decimal("0.01")
FALLBACK_RATES = {
    "USD": Decimal("1"),
    "NGN": Decimal("1545"),
    "GHS": Decimal("15.4"),
    "KES": Decimal("129.8"),
    "ZAR": Decimal("18.9"),
    "XOF": Decimal("610.5"),
}


class PaystackAPIError(Exception):
    pass


def quantize_money(value):
    return Decimal(value).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def generate_payment_reference():
    return f"SDPAY-{timezone.now():%Y%m%d%H%M%S}-{secrets.token_hex(3).upper()}"


def checkout_cache_key(reference):
    return f"{CHECKOUT_CACHE_PREFIX}:{reference}"


def payment_status_cache_key(reference):
    return f"{PAYMENT_STATUS_PREFIX}:{reference}"


def cache_checkout_payload(reference, payload):
    cache.set(checkout_cache_key(reference), payload, timeout=settings.CHECKOUT_CACHE_TIMEOUT)


def get_checkout_payload(reference):
    return cache.get(checkout_cache_key(reference))


def clear_checkout_payload(reference):
    cache.delete(checkout_cache_key(reference))


def cache_payment_status(reference, payload):
    cache.set(payment_status_cache_key(reference), payload, timeout=settings.CHECKOUT_CACHE_TIMEOUT)


def get_payment_status(reference):
    return cache.get(payment_status_cache_key(reference))


def get_exchange_rates():
    endpoint = getattr(settings, "EXCHANGE_RATES_URL", "https://open.er-api.com/v6/latest/USD")
    try:
        response = requests.get(endpoint, timeout=10)
        response.raise_for_status()
        payload = response.json()
        rates = payload.get("rates") or payload.get("conversion_rates") or {}
        return {
            code: quantize_money(rates.get(code, fallback))
            for code, fallback in FALLBACK_RATES.items()
        }
    except Exception:
        return FALLBACK_RATES


def convert_usd_to_currency(amount_usd, currency, rates=None):
    exchange_rates = rates or get_exchange_rates()
    rate = exchange_rates.get(currency, Decimal("1"))
    return quantize_money(Decimal(amount_usd) * rate)


def resolve_storefront_product(product_id):
    product = Product.objects.filter(slug=product_id, is_active=True).first()
    if product:
        return {
            "catalog_product_id": product.pk,
            "name": product.name,
            "sku": product.sku,
            "price_usd": quantize_money(product.price),
            "stock": product.stock_quantity,
        }

    snapshot = STOREFRONT_PRODUCT_CATALOG.get(product_id)
    if snapshot:
        return {
            "catalog_product_id": None,
            **snapshot,
        }

    return None


def build_storefront_cart_snapshot(items, currency):
    if not items:
        raise ValueError("Your cart is empty.")

    if currency not in FALLBACK_RATES:
        raise ValueError(f"{currency} is not configured for storefront settlement.")

    exchange_rates = get_exchange_rates()
    normalized_items = []
    subtotal_usd = Decimal("0.00")

    for entry in items:
        product_id = entry.get("id") or entry.get("productId")
        quantity = int(entry.get("quantity", 0))
        if not product_id or quantity <= 0:
            raise ValueError("Each cart item must include a valid product and quantity.")

        product = resolve_storefront_product(product_id)
        if not product:
            raise ValueError(f"{product_id} is no longer available for checkout.")
        if quantity > product["stock"]:
            raise ValueError(f"Only {product['stock']} unit(s) of {product['name']} are available.")

        unit_price_usd = quantize_money(product["price_usd"])
        line_total_usd = quantize_money(unit_price_usd * quantity)
        subtotal_usd += line_total_usd

        normalized_items.append(
            {
                "product_id": product_id,
                "catalog_product_id": product["catalog_product_id"],
                "product_name": product["name"],
                "sku": product["sku"],
                "quantity": quantity,
                "unit_price": str(convert_usd_to_currency(unit_price_usd, currency, exchange_rates)),
                "line_total": str(convert_usd_to_currency(line_total_usd, currency, exchange_rates)),
            }
        )

    subtotal_usd = quantize_money(subtotal_usd)
    shipping_usd = STOREFRONT_SHIPPING_FEE_USD if subtotal_usd > Decimal("0.00") else Decimal("0.00")
    tax_usd = Decimal("0.00")
    total_usd = subtotal_usd + shipping_usd + tax_usd

    return {
        "items": normalized_items,
        "subtotal": str(convert_usd_to_currency(subtotal_usd, currency, exchange_rates)),
        "tax_amount": str(convert_usd_to_currency(tax_usd, currency, exchange_rates)),
        "shipping_amount": str(convert_usd_to_currency(shipping_usd, currency, exchange_rates)),
        "total": str(convert_usd_to_currency(total_usd, currency, exchange_rates)),
        "currency": currency,
    }


def build_paystack_channels(payment_method):
    allowed_channels = settings.PAYSTACK_ALLOWED_CHANNELS
    if payment_method == "apple_pay":
        preferred = ["apple_pay", "card", "bank_transfer", "ussd", "bank"]
        return [channel for channel in preferred if channel in allowed_channels]
    return [payment_method] if payment_method in allowed_channels else allowed_channels


def is_apple_capable_device(user_agent):
    normalized = (user_agent or "").lower()
    apple_device = any(device in normalized for device in ["iphone", "ipad", "macintosh"])
    safari = "safari" in normalized and "chrome" not in normalized and "crios" not in normalized
    return apple_device and safari


class PaystackClient:
    base_url = "https://api.paystack.co"

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        if not self.secret_key:
            raise PaystackAPIError("PAYSTACK_SECRET_KEY is not configured.")

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_transaction(self, *, email, amount, reference, callback_url, channels, metadata):
        payload = {
            "email": email,
            "amount": int((Decimal(amount) * 100).quantize(Decimal("1"))),
            "currency": settings.PAYSTACK_CURRENCY,
            "reference": reference,
            "callback_url": callback_url,
            "channels": channels,
            "metadata": metadata,
        }
        response = requests.post(
            f"{self.base_url}/transaction/initialize",
            headers=self.headers,
            json=payload,
            timeout=20,
        )
        response_data = response.json()
        if not response.ok or not response_data.get("status"):
            raise PaystackAPIError(response_data.get("message", "Could not initialize Paystack transaction."))
        return response_data["data"]

    def verify_transaction(self, reference):
        response = requests.get(
            f"{self.base_url}/transaction/verify/{reference}",
            headers=self.headers,
            timeout=20,
        )
        response_data = response.json()
        if not response.ok or not response_data.get("status"):
            raise PaystackAPIError(response_data.get("message", "Could not verify Paystack transaction."))
        return response_data["data"]

    def validate_signature(self, body, signature):
        expected = hmac.new(
            self.secret_key.encode("utf-8"),
            msg=body,
            digestmod=hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(expected, signature or "")
