from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings

from catalog.models import Product


TWOPLACES = Decimal("0.01")


class Cart:
    session_key = "cart"

    def __init__(self, request):
        self.session = request.session
        self._cart = self.session.get(self.session_key, {})

    def save(self):
        self.session[self.session_key] = self._cart
        self.session.modified = True

    def add(self, product, quantity=1, override_quantity=False):
        product_id = str(product.pk)
        existing_quantity = int(self._cart.get(product_id, 0))
        self._cart[product_id] = quantity if override_quantity else existing_quantity + quantity
        if self._cart[product_id] <= 0:
            self._cart.pop(product_id, None)
        self.save()

    def remove(self, product):
        self._cart.pop(str(product.pk), None)
        self.save()

    def clear(self):
        self.session.pop(self.session_key, None)
        self.session.modified = True
        self._cart = {}

    def __len__(self):
        return sum(int(quantity) for quantity in self._cart.values())

    @property
    def products(self):
        product_ids = [int(product_id) for product_id in self._cart.keys()]
        return Product.objects.filter(pk__in=product_ids, is_active=True).select_related("category")

    def __iter__(self):
        products = {product.pk: product for product in self.products}
        for product_id, quantity in self._cart.items():
            product = products.get(int(product_id))
            if not product:
                continue

            qty = int(quantity)
            line_total = (product.price * qty).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
            yield {
                "product": product,
                "quantity": qty,
                "unit_price": product.price,
                "line_total": line_total,
                "available_stock": product.stock_quantity,
                "is_available": product.stock_quantity >= qty,
            }

    @property
    def subtotal(self):
        return sum((item["line_total"] for item in self), start=Decimal("0.00")).quantize(
            TWOPLACES, rounding=ROUND_HALF_UP
        )

    @property
    def shipping_amount(self):
        if self.subtotal == Decimal("0.00") or self.subtotal >= settings.CART_FREE_SHIPPING_THRESHOLD:
            return Decimal("0.00")
        return settings.CART_SHIPPING_FEE.quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    @property
    def tax_amount(self):
        return (self.subtotal * settings.CART_TAX_RATE).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    @property
    def total(self):
        return (self.subtotal + self.tax_amount + self.shipping_amount).quantize(
            TWOPLACES, rounding=ROUND_HALF_UP
        )

    def validate_stock(self):
        errors = []
        for item in self:
            if not item["is_available"]:
                errors.append(
                    f"{item['product'].name} only has {item['available_stock']} unit(s) available."
                )
        return errors

    def as_checkout_snapshot(self):
        items = []
        for item in self:
            items.append(
                {
                    "product_id": item["product"].pk,
                    "product_name": item["product"].name,
                    "slug": item["product"].slug,
                    "sku": item["product"].sku,
                    "quantity": item["quantity"],
                    "unit_price": str(item["unit_price"]),
                    "line_total": str(item["line_total"]),
                }
            )

        return {
            "items": items,
            "subtotal": str(self.subtotal),
            "tax_amount": str(self.tax_amount),
            "shipping_amount": str(self.shipping_amount),
            "total": str(self.total),
            "currency": settings.PAYSTACK_CURRENCY,
        }
