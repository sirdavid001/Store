import random

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail

CHECKOUT_CUSTOMER_KEY = "checkout_customer"
CHECKOUT_CUSTOMER_DRAFT_KEY = "checkout_customer_draft"
CHECKOUT_ADDRESS_KEY = "checkout_address"
CHECKOUT_PAYMENT_KEY = "checkout_payment"
CHECKOUT_EMAIL_VERIFIED_KEY = "checkout_email_verified"


class CheckoutSession:
    def __init__(self, request):
        self.session = request.session

    def get_customer(self):
        return self.session.get(CHECKOUT_CUSTOMER_KEY, {})

    def get_customer_draft(self):
        return self.session.get(CHECKOUT_CUSTOMER_DRAFT_KEY, {})

    def get_address(self):
        return self.session.get(CHECKOUT_ADDRESS_KEY, {})

    def get_payment(self):
        return self.session.get(CHECKOUT_PAYMENT_KEY, {})

    def set_customer(self, data):
        self.session[CHECKOUT_CUSTOMER_KEY] = data
        self.session.modified = True

    def set_customer_draft(self, data):
        self.session[CHECKOUT_CUSTOMER_DRAFT_KEY] = data
        self.session.modified = True

    def clear_customer_draft(self):
        self.session.pop(CHECKOUT_CUSTOMER_DRAFT_KEY, None)
        self.session.modified = True

    def set_address(self, data):
        self.session[CHECKOUT_ADDRESS_KEY] = data
        self.session.modified = True

    def set_payment(self, data):
        self.session[CHECKOUT_PAYMENT_KEY] = data
        self.session.modified = True

    def mark_email_verified(self, email):
        self.session[CHECKOUT_EMAIL_VERIFIED_KEY] = email.lower()
        self.session.modified = True

    def is_email_verified(self, email):
        return self.session.get(CHECKOUT_EMAIL_VERIFIED_KEY) == email.lower()

    def is_ready_for_review(self):
        return bool(self.get_customer() and self.get_address() and self.get_payment())

    def clear(self):
        for key in [
            CHECKOUT_CUSTOMER_KEY,
            CHECKOUT_CUSTOMER_DRAFT_KEY,
            CHECKOUT_ADDRESS_KEY,
            CHECKOUT_PAYMENT_KEY,
            CHECKOUT_EMAIL_VERIFIED_KEY,
        ]:
            self.session.pop(key, None)
        self.session.modified = True


def verification_cache_key(email):
    return f"checkout-email-code:{email.lower()}"


def send_checkout_verification_code(email, first_name):
    code = f"{random.randint(0, 999999):06d}"
    cache.set(verification_cache_key(email), code, timeout=900)
    send_mail(
        subject=f"Your {settings.STORE_NAME} verification code",
        message=(
            f"Hello {first_name},\n\n"
            f"Use this code to continue your checkout: {code}\n\n"
            "This code expires in 15 minutes."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def verify_checkout_code(email, code):
    cached_code = cache.get(verification_cache_key(email))
    if cached_code and str(cached_code) == str(code).strip():
        cache.delete(verification_cache_key(email))
        return True
    return False
