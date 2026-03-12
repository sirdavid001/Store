import os
from decimal import Decimal
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = BASE_DIR / "backend"


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def directory_writable(path):
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".write-test"
        probe.write_text("ok")
        probe.unlink()
        return True
    except OSError:
        return False


SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "sirdavid-gadgets-dev-secret-change-before-production-4e9c7b5a2d1f8h6k3m0q",
)
IS_VERCEL = env_bool("VERCEL", False) or "VERCEL_ENV" in os.environ
DEBUG = env_bool("DJANGO_DEBUG", not IS_VERCEL)

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    "127.0.0.1,localhost,sirdavidshop.sirdavid.site,www.sirdavidshop.sirdavid.site",
)
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "https://sirdavidshop.sirdavid.site,https://www.sirdavidshop.sirdavid.site",
)
if IS_VERCEL:
    if ".vercel.app" not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(".vercel.app")
    if "https://*.vercel.app" not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append("https://*.vercel.app")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.humanize",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
    "catalog",
    "cart",
    "checkout",
    "orders",
    "payments",
    "accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "config.context_processors.site_context",
                "cart.context_processors.cart_summary",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.app"

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
DATABASE_DEFAULT = DATABASE_URL or f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_DEFAULT,
        conn_max_age=0 if IS_VERCEL else 600,
        conn_health_checks=True,
    )
}
if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"].setdefault(
        "sslmode",
        os.environ.get("POSTGRES_SSLMODE", "require"),
    )
    if env_bool("POSTGRES_DISABLE_PREPARED_STATEMENTS", IS_VERCEL):
        DATABASES["default"]["OPTIONS"].setdefault("prepare_threshold", None)

CACHE_DIR = BASE_DIR / ".cache"
USE_FILE_CACHE = not IS_VERCEL and directory_writable(CACHE_DIR)

if USE_FILE_CACHE:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
            "LOCATION": CACHE_DIR,
            "TIMEOUT": int(os.environ.get("DJANGO_CACHE_TIMEOUT", "3600")),
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "TIMEOUT": int(os.environ.get("DJANGO_CACHE_TIMEOUT", "3600")),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lagos"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
FRONTEND_BUILD_DIR = BASE_DIR / "frontend" / "dist"
FRONTEND_TEMPLATE_FILE = BASE_DIR / "templates" / "react_storefront.html"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_REDIRECT_URL = "orders:history"
LOGOUT_REDIRECT_URL = "core:home"
LOGIN_URL = "accounts:login"

SESSION_ENGINE = (
    "django.contrib.sessions.backends.signed_cookies"
    if IS_VERCEL
    else "django.contrib.sessions.backends.db"
)
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14
SESSION_SAVE_EVERY_REQUEST = True

SITE_URL = os.environ.get(
    "SITE_URL",
    "http://127.0.0.1:8000" if DEBUG and not IS_VERCEL else "https://sirdavidshop.sirdavid.site",
)
STORE_NAME = "SirDavid Gadgets"
STORE_LEGAL_NAME = "SIRDAVID MULTI-TRADE LTD"
STORE_TAGLINE = "Premium electronics and gadgets for modern living."
SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "support@sirdavidshop.sirdavid.site")
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "orders@sirdavidshop.sirdavid.site")
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL",
    "SirDavid Gadgets <no-reply@sirdavidshop.sirdavid.site>",
)
SERVER_EMAIL = os.environ.get("SERVER_EMAIL", DEFAULT_FROM_EMAIL)

PAYSTACK_PUBLIC_KEY = os.environ.get("PAYSTACK_PUBLIC_KEY", "")
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
PAYSTACK_CURRENCY = os.environ.get("PAYSTACK_CURRENCY", "NGN")
PAYSTACK_ALLOWED_CHANNELS = env_list(
    "PAYSTACK_ALLOWED_CHANNELS",
    "card,bank,ussd,bank_transfer,apple_pay",
)
PAYSTACK_CALLBACK_URL = f"{SITE_URL.rstrip('/')}/payments/callback/"
CHECKOUT_CACHE_TIMEOUT = int(os.environ.get("CHECKOUT_CACHE_TIMEOUT", "3600"))
APPLE_PAY_ASSOCIATION_FILE = (
    BASE_DIR / ".well-known" / "apple-developer-merchantid-domain-association"
)

CART_TAX_RATE = Decimal(os.environ.get("CART_TAX_RATE", "0.075"))
CART_SHIPPING_FEE = Decimal(os.environ.get("CART_SHIPPING_FEE", "3500"))
CART_FREE_SHIPPING_THRESHOLD = Decimal(
    os.environ.get("CART_FREE_SHIPPING_THRESHOLD", "250000")
)

EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if os.environ.get("EMAIL_HOST")
    else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "20"))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", not DEBUG)
SESSION_COOKIE_SECURE = env_bool("DJANGO_SESSION_COOKIE_SECURE", not DEBUG)
CSRF_COOKIE_SECURE = env_bool("DJANGO_CSRF_COOKIE_SECURE", not DEBUG)
SECURE_HSTS_SECONDS = int(
    os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000" if not DEBUG else "0")
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS",
    not DEBUG,
)
SECURE_HSTS_PRELOAD = env_bool("DJANGO_SECURE_HSTS_PRELOAD", not DEBUG)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
}

LOG_DIR = BASE_DIR / "logs"
USE_FILE_LOGGING = (
    env_bool("DJANGO_LOG_TO_FILE", not IS_VERCEL) and directory_writable(LOG_DIR)
)

if USE_FILE_LOGGING:
    LOGGING["handlers"]["file"] = {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": LOG_DIR / "sirdavid-gadgets.log",
        "formatter": "standard",
        "maxBytes": 1024 * 1024 * 5,
        "backupCount": 3,
    }
    LOGGING["root"]["handlers"].append("file")
