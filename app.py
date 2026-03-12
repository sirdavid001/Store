import os
import sys
import traceback
from mimetypes import guess_type
from pathlib import Path

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

_django_app = None
_startup_error = None
_base_dir = Path(__file__).resolve().parent
_static_dir = _base_dir / "static"

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


def _serve_file(start_response, file_path):
    content_type, encoding = guess_type(file_path.name)
    payload = file_path.read_bytes()
    headers = [
        ("Content-Type", content_type or "application/octet-stream"),
        ("Content-Length", str(len(payload))),
        ("Cache-Control", "public, max-age=86400"),
    ]
    if encoding:
        headers.append(("Content-Encoding", encoding))
    start_response("200 OK", headers)
    return [payload]


def app(environ, start_response):
    path = environ.get("PATH_INFO", "")

    if path == "/_health":
        if _startup_error:
            return _respond(start_response, "500 Internal Server Error", _startup_error)
        return _respond(start_response, "200 OK", "ok")

    if path.startswith("/static/"):
        requested = path.removeprefix("/static/")
        static_file = (_static_dir / requested).resolve()
        if _static_dir.resolve() not in static_file.parents or not static_file.exists() or not static_file.is_file():
            return _respond(start_response, "404 Not Found", "Static asset not found")
        return _serve_file(start_response, static_file)

    if _django_app is None:
        return _respond(start_response, "500 Internal Server Error", _startup_error or "Startup failed")

    try:
        return _django_app(environ, start_response)
    except Exception:
        trace = traceback.format_exc()
        print(trace, file=sys.stderr)
        return _respond(start_response, "500 Internal Server Error", trace)


application = app
