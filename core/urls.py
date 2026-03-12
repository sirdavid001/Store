from django.urls import path, re_path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.react_storefront, name="home"),
    path("session/status/", views.session_status, name="session-status"),
    path("frontend-assets/<path:asset_path>", views.react_asset, name="react-asset"),
    path("secure-admin-portal-xyz/", views.staff_portal, name="staff-portal"),
    path("admin-setup-first-time/", views.react_storefront, name="admin-setup-first-time"),
    re_path(
        r"^(?:shop|cart|track-order|terms-and-conditions|refund-policy|privacy-policy|shipping-policy|faqs|legal)/?$",
        views.react_storefront,
        name="react-route",
    ),
    re_path(r"^product/[^/]+/?$", views.react_storefront, name="react-product"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
    path("faq/", views.faq, name="faq"),
    path("terms/", views.terms, name="terms"),
    path("privacy/", views.privacy, name="privacy"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path(
        ".well-known/apple-developer-merchantid-domain-association",
        views.apple_pay_verification_file,
        name="apple-pay-verification",
    ),
]
