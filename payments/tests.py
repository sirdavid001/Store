import json
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from catalog.models import Category, Product
from orders.models import Order
from payments.services import cache_checkout_payload


class PaymentFlowTests(TestCase):
    def setUp(self):
        self.client = Client(HTTP_HOST="localhost")
        self.category = Category.objects.create(name="Phones")
        self.product = Product.objects.create(
            category=self.category,
            name="Webhook Test Phone",
            short_description="Test product",
            description="Detailed description",
            price=Decimal("1000.00"),
            sku="TEST-PHONE-001",
            stock_quantity=5,
            is_active=True,
        )

    def _set_checkout_session(self):
        session = self.client.session
        session["cart"] = {str(self.product.id): 1}
        session["checkout_customer"] = {
            "first_name": "Ada",
            "last_name": "Buyer",
            "email": "ada@example.com",
            "phone": "08000000000",
        }
        session["checkout_address"] = {
            "address_line1": "1 Market Road",
            "address_line2": "",
            "city": "Lagos",
            "state": "Lagos",
            "country": "Nigeria",
            "postal_code": "100001",
            "delivery_instructions": "",
        }
        session["checkout_payment"] = {"payment_method": "card"}
        session.save()

    @mock.patch("checkout.views.PaystackClient")
    def test_review_step_initializes_payment_without_creating_order(self, paystack_client):
        self._set_checkout_session()
        paystack_client.return_value.initialize_transaction.return_value = {
            "authorization_url": "https://paystack.example/redirect"
        }

        response = self.client.post(reverse("checkout:review"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Order.objects.count(), 0)

    @mock.patch("payments.views.PaystackClient")
    def test_verified_webhook_creates_order_and_reduces_stock(self, paystack_client):
        reference = "SDPAY-TEST-001"
        checkout_payload = {
            "reference": reference,
            "user_id": None,
            "customer": {
                "first_name": "Ada",
                "last_name": "Buyer",
                "email": "ada@example.com",
                "phone": "08000000000",
            },
            "address": {
                "address_line1": "1 Market Road",
                "address_line2": "",
                "city": "Lagos",
                "state": "Lagos",
                "country": "Nigeria",
                "postal_code": "100001",
                "delivery_instructions": "",
            },
            "payment": {"payment_method": "card"},
            "cart": {
                "items": [
                    {
                        "product_id": self.product.id,
                        "product_name": self.product.name,
                        "slug": self.product.slug,
                        "sku": self.product.sku,
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "line_total": "1000.00",
                    }
                ],
                "subtotal": "1000.00",
                "tax_amount": "75.00",
                "shipping_amount": "3500.00",
                "total": "4575.00",
                "currency": "NGN",
            },
        }
        cache_checkout_payload(reference, checkout_payload)
        paystack_client.return_value.validate_signature.return_value = True
        paystack_client.return_value.verify_transaction.return_value = {
            "status": "success",
            "amount": 457500,
            "channel": "card",
            "paid_at": timezone.now().isoformat(),
        }

        response = self.client.post(
            reverse("payments:webhook"),
            data=json.dumps({"event": "charge.success", "data": {"reference": reference}}),
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="valid",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Order.objects.count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 4)
        cache.clear()

# Create your tests here.
