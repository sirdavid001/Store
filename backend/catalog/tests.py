from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from .models import Category, Product, ProductSpecification


class StorefrontProductFeedTests(TestCase):
    def test_feed_returns_active_products_for_react_storefront(self):
        category = Category.objects.create(name="Phones")
        product = Product.objects.create(
            category=category,
            name="Storefront Phone",
            brand="Apple",
            short_description="Live from admin",
            description="Detailed product description",
            price=Decimal("1499.00"),
            sku="PHONE-001",
            stock_quantity=7,
            featured=True,
            is_active=True,
        )
        ProductSpecification.objects.create(
            product=product,
            label="Storage",
            value="256GB",
        )
        Product.objects.create(
            category=category,
            name="Inactive Phone",
            brand="Apple",
            short_description="Should stay hidden",
            description="Hidden from storefront",
            price=Decimal("999.00"),
            sku="PHONE-002",
            stock_quantity=3,
            is_active=False,
        )

        response = self.client.get(reverse("catalog:storefront-products"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["products"]), 1)
        self.assertEqual(payload["products"][0]["id"], product.slug)
        self.assertEqual(payload["products"][0]["category"], category.slug)
        self.assertEqual(payload["products"][0]["short_description"], "Live from admin")
        self.assertEqual(payload["products"][0]["specs"], [["Storage", "256GB"]])
