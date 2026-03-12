from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from cart.cart import Cart
from checkout.services import CheckoutSession

from .forms import OrderTrackingForm
from .models import Order


def track_order(request):
    form = OrderTrackingForm(request.POST or None)
    order = None

    if request.method == "POST" and form.is_valid():
        order_id = form.cleaned_data["order_id"].strip()
        email = form.cleaned_data["email"].strip().lower()
        order = Order.objects.filter(email__iexact=email).filter(
            order_number__iexact=order_id
        ).first() or Order.objects.filter(email__iexact=email).filter(
            tracking_number__iexact=order_id
        ).first()
        if not order:
            form.add_error(None, "No order matched that email and ID.")

    return render(
        request,
        "orders/tracking.html",
        {
            "form": form,
            "order": order,
            "breadcrumbs": [{"label": "Track order", "url": None}],
        },
    )


def order_confirmation(request, order_number):
    order = get_object_or_404(Order, order_number=order_number)
    session_match = request.session.get("last_order_number") == order.order_number
    owner_match = request.user.is_authenticated and order.user_id == request.user.id

    if not session_match and not owner_match:
        return redirect("orders:track")

    if session_match:
        Cart(request).clear()
        CheckoutSession(request).clear()

    return render(
        request,
        "orders/confirmation.html",
        {
            "order": order,
            "breadcrumbs": [
                {"label": "Orders", "url": None},
                {"label": order.order_number, "url": None},
            ],
        },
    )


@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).prefetch_related("items")
    return render(
        request,
        "orders/history.html",
        {
            "orders": orders,
            "breadcrumbs": [{"label": "Order history", "url": None}],
        },
    )

# Create your views here.
