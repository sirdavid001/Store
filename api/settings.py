import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from backend.config.settings import *  # noqa: F403


ROOT_URLCONF = "api.urls"
WSGI_APPLICATION = "api.wsgi.app"
ASGI_APPLICATION = "api.asgi.application"
