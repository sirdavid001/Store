from decimal import Decimal

from django import template
from django.conf import settings

register = template.Library()


@register.filter
def money(value):
    try:
        amount = Decimal(value)
    except Exception:
        return value

    symbols = {
        "NGN": "N",
        "USD": "$",
        "GBP": "£",
        "EUR": "€",
    }
    symbol = symbols.get(settings.PAYSTACK_CURRENCY, settings.PAYSTACK_CURRENCY)
    return f"{symbol}{amount:,.2f}"
