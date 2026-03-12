import mimetypes
from pathlib import Path

from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.views import redirect_to_login
from django.core.mail import send_mail
from django.db.models import Count, Sum
from django.http import FileResponse, Http404, HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie

from catalog.models import Category, Product
from orders.models import Order, OrderItem

from .forms import ContactForm


FRONTEND_BUILD_DIR = Path(settings.BASE_DIR) / "frontend_build"
FRONTEND_INDEX_FILE = FRONTEND_BUILD_DIR / "index.html"


def session_payload(request):
    is_authenticated = request.user.is_authenticated
    username = request.user.get_username() if is_authenticated else ""
    display_name = request.user.get_full_name() if is_authenticated else ""

    return {
        "isAuthenticated": is_authenticated,
        "isStaff": bool(is_authenticated and request.user.is_staff),
        "username": username,
        "displayName": display_name or username,
        "loginUrl": reverse("accounts:login"),
        "logoutUrl": reverse("accounts:logout"),
    }


def home(request):
    featured_products = Product.objects.filter(is_active=True, featured=True).select_related("category")[:8]
    featured_categories = Category.objects.filter(featured=True)[:4]
    latest_products = Product.objects.filter(is_active=True).select_related("category")[:6]
    return render(
        request,
        "core/home.html",
        {
            "featured_products": featured_products,
            "featured_categories": featured_categories,
            "latest_products": latest_products,
        },
    )


def about(request):
    return render(
        request,
        "core/about.html",
        {"breadcrumbs": [{"label": "About us", "url": None}]},
    )


def faq(request):
    return render(
        request,
        "core/faq.html",
        {"breadcrumbs": [{"label": "FAQ", "url": None}]},
    )


def terms(request):
    return render(
        request,
        "core/terms.html",
        {"breadcrumbs": [{"label": "Terms & conditions", "url": None}]},
    )


def privacy(request):
    return render(
        request,
        "core/privacy.html",
        {"breadcrumbs": [{"label": "Privacy policy", "url": None}]},
    )


def contact(request):
    form = ContactForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        send_mail(
            subject=f"[Contact] {form.cleaned_data['subject']}",
            message=(
                f"Name: {form.cleaned_data['name']}\n"
                f"Email: {form.cleaned_data['email']}\n\n"
                f"{form.cleaned_data['message']}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
            fail_silently=False,
        )
        messages.success(request, "Message sent. We will get back to you shortly.")
        return redirect("core:contact")
    return render(
        request,
        "core/contact.html",
        {
            "form": form,
            "breadcrumbs": [{"label": "Contact us", "url": None}],
        },
    )


@staff_member_required
def dashboard(request):
    top_items = (
        OrderItem.objects.values("product_name")
        .annotate(quantity_sold=Sum("quantity"))
        .order_by("-quantity_sold")[:5]
    )
    context = {
        "order_count": Order.objects.count(),
        "paid_revenue": Order.objects.aggregate(total=Sum("total_amount"))["total"] or 0,
        "pending_orders": Order.objects.filter(status=Order.Status.PENDING).count(),
        "processing_orders": Order.objects.filter(status=Order.Status.PROCESSING).count(),
        "recent_orders": Order.objects.select_related("user")[:8],
        "top_items": top_items,
        "category_count": Category.objects.count(),
        "product_count": Product.objects.count(),
        "breadcrumbs": [{"label": "Operations dashboard", "url": None}],
    }
    return render(request, "core/dashboard.html", context)


def apple_pay_verification_file(request):
    if not settings.APPLE_PAY_ASSOCIATION_FILE.exists():
        raise Http404("Apple Pay verification file is not configured.")
    return FileResponse(
        settings.APPLE_PAY_ASSOCIATION_FILE.open("rb"),
        content_type="text/plain",
    )


@ensure_csrf_cookie
def react_storefront(request):
    if not FRONTEND_INDEX_FILE.exists():
        return HttpResponse(
            "The React storefront bundle has not been built yet. Run `npm run build` in `frontend/`.",
            content_type="text/plain; charset=utf-8",
            status=503,
        )

    response = HttpResponse(
        FRONTEND_INDEX_FILE.read_text(encoding="utf-8"),
        content_type="text/html; charset=utf-8",
    )
    response["Cache-Control"] = "no-cache"
    return response


def staff_portal(request):
    if not request.user.is_authenticated:
        return redirect_to_login(request.get_full_path(), login_url=settings.LOGIN_URL)
    if not request.user.is_staff:
        return HttpResponseForbidden("Staff access required.")
    return react_storefront(request)


def session_status(request):
    response = JsonResponse(session_payload(request))
    response["Cache-Control"] = "no-store"
    return response


def react_asset(request, asset_path):
    asset_file = (FRONTEND_BUILD_DIR / asset_path).resolve()
    build_root = FRONTEND_BUILD_DIR.resolve()

    if build_root not in asset_file.parents:
        raise Http404("Invalid asset path.")
    if not asset_file.exists() or not asset_file.is_file():
        raise Http404("Asset not found.")

    content_type, encoding = mimetypes.guess_type(asset_file.name)
    response = FileResponse(
        asset_file.open("rb"),
        content_type=content_type or "application/octet-stream",
    )
    response["Cache-Control"] = "public, max-age=31536000, immutable"
    if encoding:
        response["Content-Encoding"] = encoding
    return response
