import json
import logging
from decimal import Decimal

from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from orders.models import Order
from orders.services import create_order_from_verified_payment

from .services import (
    PaystackAPIError,
    PaystackClient,
    build_paystack_channels,
    build_storefront_cart_snapshot,
    cache_checkout_payload,
    cache_payment_status,
    clear_checkout_payload,
    get_checkout_payload,
    get_payment_status,
    generate_payment_reference,
    is_apple_capable_device,
)

logger = logging.getLogger(__name__)


def _validate_storefront_checkout(data):
    customer = data.get("customer") or {}
    address = data.get("address") or {}
    payment_method = (data.get("payment_method") or "card").strip()

    required_customer = {
        "first_name": "First name",
        "last_name": "Last name",
        "email": "Email address",
        "phone": "Phone number",
    }
    required_address = {
        "address_line1": "Address line 1",
        "city": "City",
        "state": "State",
        "country": "Country",
    }

    for key, label in required_customer.items():
        if not str(customer.get(key, "")).strip():
            raise ValueError(f"{label} is required.")
    for key, label in required_address.items():
        if not str(address.get(key, "")).strip():
            raise ValueError(f"{label} is required.")

    try:
        validate_email(customer["email"])
    except ValidationError as exc:
        raise ValueError("Enter a valid email address.") from exc

    if payment_method not in {"card", "bank_transfer", "ussd", "apple_pay"}:
        raise ValueError("Choose a supported payment method.")
    if payment_method == "apple_pay" and not is_apple_capable_device(data.get("user_agent", "")):
        raise ValueError("Apple Pay is only available on supported Safari devices.")

    return {
        "customer": {
            "first_name": customer["first_name"].strip(),
            "last_name": customer["last_name"].strip(),
            "email": customer["email"].strip().lower(),
            "phone": customer["phone"].strip(),
        },
        "address": {
            "address_line1": address["address_line1"].strip(),
            "address_line2": str(address.get("address_line2", "")).strip(),
            "city": address["city"].strip(),
            "state": address["state"].strip(),
            "country": address["country"].strip(),
            "postal_code": str(address.get("postal_code", "")).strip(),
            "delivery_instructions": str(address.get("delivery_instructions", "")).strip(),
        },
        "payment_method": payment_method,
    }


@require_POST
def storefront_initialize_payment(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid checkout payload."}, status=400)

    try:
        checkout_data = _validate_storefront_checkout(
            {
                **payload,
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            }
        )
        settlement_currency = settings.PAYSTACK_CURRENCY
        cart_snapshot = build_storefront_cart_snapshot(payload.get("items") or [], settlement_currency)
        reference = generate_payment_reference()
        checkout_payload = {
            "reference": reference,
            "user_id": request.user.id if request.user.is_authenticated else None,
            "customer": checkout_data["customer"],
            "address": checkout_data["address"],
            "payment": {"payment_method": checkout_data["payment_method"]},
            "cart": cart_snapshot,
            "source": "react_storefront",
        }
        cache_checkout_payload(reference, checkout_payload)
        cache_payment_status(reference, {"status": "initialized"})

        transaction = PaystackClient().initialize_transaction(
            email=checkout_data["customer"]["email"],
            amount=Decimal(cart_snapshot["total"]),
            reference=reference,
            callback_url=settings.PAYSTACK_CALLBACK_URL,
            channels=build_paystack_channels(checkout_data["payment_method"]),
            metadata={
                "reference": reference,
                "store_name": settings.STORE_NAME,
                "source": "react_storefront",
                "display_currency": payload.get("display_currency", settlement_currency),
                "customer_name": (
                    f"{checkout_data['customer']['first_name']} "
                    f"{checkout_data['customer']['last_name']}"
                ).strip(),
            },
        )
        return JsonResponse(
            {
                "reference": reference,
                "authorization_url": transaction["authorization_url"],
                "currency": settlement_currency,
            }
        )
    except ValueError as exc:
        return JsonResponse({"message": str(exc)}, status=400)
    except PaystackAPIError as exc:
        return JsonResponse({"message": str(exc)}, status=400)


@require_GET
def payment_callback(request):
    reference = request.GET.get("reference") or request.GET.get("trxref")
    if not reference:
        return redirect("checkout:review")

    order = Order.objects.filter(paystack_reference=reference).first()
    if order:
        request.session["last_order_number"] = order.order_number
        return redirect("orders:confirmation", order_number=order.order_number)

    transaction_status = "pending"
    try:
        verification = PaystackClient().verify_transaction(reference)
        transaction_status = verification.get("status", "pending")
    except PaystackAPIError as exc:
        logger.warning("Paystack callback verify failed for %s: %s", reference, exc)

    return render(
        request,
        "payments/callback.html",
        {
            "reference": reference,
            "transaction_status": transaction_status,
            "breadcrumbs": [{"label": "Payment confirmation", "url": None}],
        },
    )


@require_GET
def payment_status(request, reference):
    order = Order.objects.filter(paystack_reference=reference).first()
    if order:
        request.session["last_order_number"] = order.order_number
        return JsonResponse(
            {
                "status": "ready",
                "order_number": order.order_number,
                "redirect_url": reverse("orders:confirmation", args=[order.order_number]),
            }
        )

    cached_status = get_payment_status(reference)
    return JsonResponse(cached_status or {"status": "pending"})


@csrf_exempt
@require_POST
def paystack_webhook(request):
    try:
        client = PaystackClient()
    except PaystackAPIError:
        return HttpResponse(status=500)

    signature = request.headers.get("x-paystack-signature", "")
    if not client.validate_signature(request.body, signature):
        logger.warning("Rejected Paystack webhook due to invalid signature.")
        return HttpResponse(status=400)

    payload = json.loads(request.body.decode("utf-8"))
    if payload.get("event") != "charge.success":
        return HttpResponse(status=200)

    reference = payload["data"]["reference"]
    checkout_payload = get_checkout_payload(reference)
    if not checkout_payload:
        logger.error("Checkout payload missing for reference %s", reference)
        cache_payment_status(
            reference,
            {"status": "failed", "message": "Checkout payload expired before confirmation."},
        )
        return HttpResponse(status=500)

    try:
        verification = client.verify_transaction(reference)
        expected_amount = int((Decimal(checkout_payload["cart"]["total"]) * 100).quantize(Decimal("1")))
        if verification.get("status") != "success" or verification.get("amount") != expected_amount:
            logger.error("Paystack verification mismatch for reference %s", reference)
            cache_payment_status(reference, {"status": "failed", "message": "Payment verification failed."})
            return HttpResponse(status=400)

        order, created = create_order_from_verified_payment(reference, checkout_payload, verification)
        cache_payment_status(
            reference,
            {
                "status": "ready",
                "order_number": order.order_number,
                "redirect_url": reverse("orders:confirmation", args=[order.order_number]),
            },
        )
        clear_checkout_payload(reference)
        logger.info("Webhook processed for %s (created=%s)", reference, created)
        return HttpResponse(status=200)
    except Exception:
        logger.exception("Failed processing Paystack webhook for %s", reference)
        return HttpResponse(status=500)

# Create your views here.
