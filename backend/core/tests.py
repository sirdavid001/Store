from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock

from django.test import TestCase


class StorefrontRouteTests(TestCase):
    def test_staff_portal_uses_react_storefront_for_anonymous_users(self):
        with TemporaryDirectory() as tmpdir:
            template_file = Path(tmpdir) / "react_storefront.html"
            template_file.write_text("<!doctype html><html><body><div id='root'></div></body></html>")

            with mock.patch("core.views.FRONTEND_TEMPLATE_FILE", template_file):
                response = self.client.get("/secure-admin-portal-xyz/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<div id='root'></div>", html=False)
