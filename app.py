import os
import sys
import traceback
from mimetypes import guess_type
from pathlib import Path

from django.core.wsgi import get_wsgi_application

_django_app = None
_startup_error = None
_base_dir = Path(__file__).resolve().parent
_backend_dir = (_base_dir / "backend").resolve()

if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

_static_dirs = [
    (_base_dir / "staticfiles").resolve(),
    (_base_dir / "static").resolve(),
]

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


def _resolve_static_file(requested_path):
    for static_dir in _static_dirs:
        candidate = (static_dir / requested_path).resolve()
        if static_dir not in candidate.parents:
            continue
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def app(environ, start_response):
    path = environ.get("PATH_INFO", "")

    if path == "/_health":
        if _startup_error:
            return _respond(start_response, "500 Internal Server Error", _startup_error)
        return _respond(start_response, "200 OK", "ok")

    if path.startswith("/static/"):
        requested = path.removeprefix("/static/")
        static_file = _resolve_static_file(requested)
        if static_file is None:
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
