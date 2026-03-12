from django.conf import settings
from django.contrib import messages
from django.shortcuts import redirect, render
from django.urls import reverse

from cart.cart import Cart
from payments.services import (
    PaystackAPIError,
    PaystackClient,
    build_paystack_channels,
    cache_checkout_payload,
    generate_payment_reference,
    is_apple_capable_device,
)

from .forms import CustomerInformationForm, PaymentMethodForm, ShippingAddressForm
from .services import CheckoutSession, send_checkout_verification_code, verify_checkout_code


def _ensure_cart(request):
    cart = Cart(request)
    if len(cart) == 0:
        messages.info(request, "Your cart is empty.")
        return None
    return cart


def customer_step(request):
    cart = _ensure_cart(request)
    if not cart:
        return redirect("catalog:list")

    checkout = CheckoutSession(request)
    initial = checkout.get_customer() or checkout.get_customer_draft()
    form = CustomerInformationForm(request.POST or None, initial=initial)

    if request.method == "POST" and form.is_valid():
        action = request.POST.get("action", "verify")
        customer_data = {
            "first_name": form.cleaned_data["first_name"],
            "last_name": form.cleaned_data["last_name"],
            "email": form.cleaned_data["email"].lower(),
            "phone": form.cleaned_data["phone"],
        }
        checkout.set_customer_draft(customer_data)

        if action == "send_code":
            send_checkout_verification_code(customer_data["email"], customer_data["first_name"])
            messages.success(request, "Verification code sent. Check your email to continue.")
        else:
            verification_code = form.cleaned_data.get("verification_code")
            if not verification_code:
                form.add_error("verification_code", "Enter the verification code we emailed to you.")
            elif verify_checkout_code(customer_data["email"], verification_code):
                checkout.set_customer(customer_data)
                checkout.mark_email_verified(customer_data["email"])
                checkout.clear_customer_draft()
                messages.success(request, "Email address verified.")
                return redirect("checkout:address")
            else:
                form.add_error("verification_code", "That verification code is invalid or expired.")

    return render(
        request,
        "checkout/customer.html",
        {
            "form": form,
            "breadcrumbs": [
                {"label": "Cart", "url": reverse("cart:detail")},
                {"label": "Customer details", "url": None},
            ],
        },
    )


def address_step(request):
    cart = _ensure_cart(request)
    if not cart:
        return redirect("catalog:list")

    checkout = CheckoutSession(request)
    if not checkout.get_customer():
        return redirect("checkout:customer")

    form = ShippingAddressForm(request.POST or None, initial=checkout.get_address())
    if request.method == "POST" and form.is_valid():
        checkout.set_address(form.cleaned_data)
        return redirect("checkout:payment")

    return render(
        request,
        "checkout/address.html",
        {
            "form": form,
            "breadcrumbs": [
                {"label": "Customer details", "url": reverse("checkout:customer")},
                {"label": "Delivery address", "url": None},
            ],
        },
    )


def payment_step(request):
    cart = _ensure_cart(request)
    if not cart:
        return redirect("catalog:list")

    checkout = CheckoutSession(request)
    if not checkout.get_customer():
        return redirect("checkout:customer")
    if not checkout.get_address():
        return redirect("checkout:address")

    apple_capable = is_apple_capable_device(request.META.get("HTTP_USER_AGENT", ""))
    initial = checkout.get_payment() or {
        "payment_method": "apple_pay" if apple_capable else "card",
    }
    form = PaymentMethodForm(
        request.POST or None,
        initial=initial,
        apple_capable=apple_capable,
    )
    if request.method == "POST" and form.is_valid():
        checkout.set_payment(form.cleaned_data)
        return redirect("checkout:review")

    return render(
        request,
        "checkout/payment_method.html",
        {
            "form": form,
            "apple_capable": apple_capable,
            "breadcrumbs": [
                {"label": "Customer details", "url": reverse("checkout:customer")},
                {"label": "Delivery address", "url": reverse("checkout:address")},
                {"label": "Payment method", "url": None},
            ],
        },
    )


def review_step(request):
    cart = _ensure_cart(request)
    if not cart:
        return redirect("catalog:list")

    checkout = CheckoutSession(request)
    if not checkout.is_ready_for_review():
        return redirect("checkout:customer")

    if request.method == "POST":
        stock_errors = cart.validate_stock()
        if stock_errors:
            for error in stock_errors:
                messages.error(request, error)
            return redirect("cart:detail")

        customer = checkout.get_customer()
        payment = checkout.get_payment()
        reference = generate_payment_reference()
        checkout_payload = {
            "reference": reference,
            "user_id": request.user.id if request.user.is_authenticated else None,
            "customer": customer,
            "address": checkout.get_address(),
            "payment": payment,
            "cart": cart.as_checkout_snapshot(),
        }
        cache_checkout_payload(reference, checkout_payload)

        try:
            transaction = PaystackClient().initialize_transaction(
                email=customer["email"],
                amount=cart.total,
                reference=reference,
                callback_url=settings.PAYSTACK_CALLBACK_URL,
                channels=build_paystack_channels(payment["payment_method"]),
                metadata={
                    "reference": reference,
                    "store_name": settings.STORE_NAME,
                    "customer_name": f"{customer['first_name']} {customer['last_name']}",
                },
            )
            return redirect(transaction["authorization_url"])
        except PaystackAPIError as exc:
            messages.error(request, str(exc))

    return render(
        request,
        "checkout/review.html",
        {
            "cart": cart,
            "customer": checkout.get_customer(),
            "address": checkout.get_address(),
            "payment": checkout.get_payment(),
            "breadcrumbs": [
                {"label": "Customer details", "url": reverse("checkout:customer")},
                {"label": "Delivery address", "url": reverse("checkout:address")},
                {"label": "Payment method", "url": reverse("checkout:payment")},
                {"label": "Review order", "url": None},
            ],
        },
    )

# Create your views here.
