import os
import sys
from pathlib import Path

from django.core.wsgi import get_wsgi_application


BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

app = get_wsgi_application()
application = app
