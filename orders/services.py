import logging
import secrets
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from catalog.models import Product

from .models import Order, OrderItem

logger = logging.getLogger(__name__)
User = get_user_model()


def _unique_token(prefix):
    return f"{prefix}-{timezone.now():%Y%m%d}-{secrets.token_hex(3).upper()}"


def _deliver_email(subject_template, text_template, recipients, context, html_template=None):
    subject = render_to_string(subject_template, context).strip()
    body = render_to_string(text_template, context)
    message = EmailMultiAlternatives(subject, body, settings.DEFAULT_FROM_EMAIL, recipients)
    if html_template:
        html_body = render_to_string(html_template, context)
        message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def send_order_notifications(order):
    context = {"order": order}
    _deliver_email(
        "emails/order_confirmation_subject.txt",
        "emails/order_confirmation.txt",
        [order.email],
        context,
        "emails/order_confirmation.html",
    )
    _deliver_email(
        "emails/admin_new_order_subject.txt",
        "emails/admin_new_order.txt",
        [settings.ADMIN_NOTIFICATION_EMAIL],
        context,
    )


def send_order_status_email(order):
    context = {"order": order}
    _deliver_email(
        "emails/order_status_update_subject.txt",
        "emails/order_status_update.txt",
        [order.email],
        context,
        "emails/order_status_update.html",
    )


@transaction.atomic
def create_order_from_verified_payment(reference, checkout_payload, verification):
    existing_order = Order.objects.filter(paystack_reference=reference).first()
    if existing_order:
        return existing_order, False

    customer = checkout_payload["customer"]
    address = checkout_payload["address"]
    payment = checkout_payload["payment"]
    cart_snapshot = checkout_payload["cart"]

    product_ids = [item["product_id"] for item in cart_snapshot["items"]]
    products = Product.objects.select_for_update().filter(pk__in=product_ids, is_active=True)
    product_map = {product.pk: product for product in products}

    user = None
    user_id = checkout_payload.get("user_id")
    if user_id:
        user = User.objects.filter(pk=user_id).first()

    paid_at = parse_datetime(verification.get("paid_at") or "") or timezone.now()

    order = Order.objects.create(
        user=user,
        order_number=_unique_token("SDG"),
        tracking_number=_unique_token("TRK"),
        email=customer["email"],
        first_name=customer["first_name"],
        last_name=customer["last_name"],
        phone=customer["phone"],
        address_line1=address["address_line1"],
        address_line2=address.get("address_line2", ""),
        city=address["city"],
        state=address["state"],
        country=address["country"],
        postal_code=address.get("postal_code", ""),
        delivery_instructions=address.get("delivery_instructions", ""),
        subtotal=Decimal(cart_snapshot["subtotal"]),
        tax_amount=Decimal(cart_snapshot["tax_amount"]),
        shipping_amount=Decimal(cart_snapshot["shipping_amount"]),
        total_amount=Decimal(cart_snapshot["total"]),
        currency=cart_snapshot["currency"],
        payment_method=payment["payment_method"],
        payment_channel=verification.get("channel", payment["payment_method"]),
        paystack_reference=reference,
        paid_at=paid_at,
        notes=checkout_payload.get("notes", ""),
    )

    order_items = []
    for item in cart_snapshot["items"]:
        product = product_map.get(item["product_id"])
        if not product:
            raise ValueError(f"Product {item['product_id']} was not found during checkout confirmation.")
        if product.stock_quantity < item["quantity"]:
            raise ValueError(f"Insufficient stock for {product.name}.")

        product.stock_quantity -= item["quantity"]
        product.save(update_fields=["stock_quantity", "updated_at"])

        order_items.append(
            OrderItem(
                order=order,
                product=product,
                product_name=item["product_name"],
                sku=item["sku"],
                quantity=item["quantity"],
                unit_price=Decimal(item["unit_price"]),
                line_total=Decimal(item["line_total"]),
            )
        )

    OrderItem.objects.bulk_create(order_items)
    transaction.on_commit(lambda: send_order_notifications(order))
    logger.info("Order %s created for Paystack reference %s", order.order_number, reference)
    return order, True
