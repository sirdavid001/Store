import hashlib
import hmac
import logging
import secrets
from decimal import Decimal

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

CHECKOUT_CACHE_PREFIX = "checkout-draft"
PAYMENT_STATUS_PREFIX = "payment-status"


class PaystackAPIError(Exception):
    pass


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
