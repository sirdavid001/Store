from django.conf import settings


def site_context(request):
    return {
        "store_name": settings.STORE_NAME,
        "store_legal_name": settings.STORE_LEGAL_NAME,
        "store_tagline": settings.STORE_TAGLINE,
        "support_email": settings.SUPPORT_EMAIL,
        "site_url": settings.SITE_URL,
        "paystack_public_key": settings.PAYSTACK_PUBLIC_KEY,
        "paystack_currency": settings.PAYSTACK_CURRENCY,
        "cart_tax_rate": settings.CART_TAX_RATE,
        "cart_shipping_fee": settings.CART_SHIPPING_FEE,
        "cart_free_shipping_threshold": settings.CART_FREE_SHIPPING_THRESHOLD,
    }
