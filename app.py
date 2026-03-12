import os
import sys
import traceback

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

_django_app = None
_startup_error = None

try:
    _django_app = get_wsgi_application()
except Exception:
    _startup_error = traceback.format_exc()
    print(_startup_error, file=sys.stderr)


def _respond(start_response, status, body):
    payload = body.encode("utf-8")
    start_response(
        status,
        [
            ("Content-Type", "text/plain; charset=utf-8"),
            ("Content-Length", str(len(payload))),
        ],
    )
    return [payload]


def app(environ, start_response):
    path = environ.get("PATH_INFO", "")

    if path == "/_health":
        if _startup_error:
            return _respond(start_response, "500 Internal Server Error", _startup_error)
        return _respond(start_response, "200 OK", "ok")

    if _django_app is None:
        return _respond(start_response, "500 Internal Server Error", _startup_error or "Startup failed")

    try:
        return _django_app(environ, start_response)
    except Exception:
        trace = traceback.format_exc()
        print(trace, file=sys.stderr)
        return _respond(start_response, "500 Internal Server Error", trace)


application = app
