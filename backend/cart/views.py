from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from catalog.models import Product

from .cart import Cart


def _parse_quantity(value, default=1):
    try:
        return max(int(value), 0)
    except (TypeError, ValueError):
        return default


def cart_detail(request):
    cart = Cart(request)
    return render(
        request,
        "cart/detail.html",
        {
            "cart": cart,
            "breadcrumbs": [{"label": "Cart", "url": None}],
        },
    )


@require_POST
def add_to_cart(request, product_id):
    cart = Cart(request)
    product = get_object_or_404(Product, pk=product_id, is_active=True)
    quantity = max(_parse_quantity(request.POST.get("quantity", 1), default=1), 1)

    if quantity > product.stock_quantity:
        messages.error(request, f"Only {product.stock_quantity} unit(s) of {product.name} are available.")
    else:
        cart.add(product, quantity=quantity)
        messages.success(request, f"{product.name} added to your cart.")

    return redirect(request.POST.get("next") or "cart:detail")


@require_POST
def update_cart(request, product_id):
    cart = Cart(request)
    product = get_object_or_404(Product, pk=product_id, is_active=True)
    quantity = _parse_quantity(request.POST.get("quantity", 1), default=1)

    if quantity == 0:
        cart.remove(product)
        messages.info(request, f"{product.name} removed from your cart.")
    elif quantity > product.stock_quantity:
        messages.error(request, f"Only {product.stock_quantity} unit(s) of {product.name} are available.")
    else:
        cart.add(product, quantity=quantity, override_quantity=True)
        messages.success(request, f"{product.name} quantity updated.")

    return redirect("cart:detail")


@require_POST
def remove_from_cart(request, product_id):
    cart = Cart(request)
    product = get_object_or_404(Product, pk=product_id)
    cart.remove(product)
    messages.info(request, f"{product.name} removed from your cart.")
    return redirect("cart:detail")

# Create your views here.
