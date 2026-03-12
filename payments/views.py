import json
import logging
from decimal import Decimal

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
    cache_payment_status,
    clear_checkout_payload,
    get_checkout_payload,
    get_payment_status,
)

logger = logging.getLogger(__name__)


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
