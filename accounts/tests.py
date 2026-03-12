import json

from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class AccountExperienceTests(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="operator",
            password="AdminPass123!",
            first_name="Store",
            last_name="Operator",
            is_staff=True,
        )

    def test_login_page_renders_admin_copy_and_next_field(self):
        response = self.client.get("/accounts/login/?next=/secure-admin-portal-xyz/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Same brand. Proper admin sign-in.")
        self.assertContains(response, "Continue to Admin Portal")
        self.assertContains(
            response,
            'name="next" value="/secure-admin-portal-xyz/"',
            html=False,
        )

    def test_session_login_returns_authenticated_staff_payload(self):
        response = self.client.post(
            "/accounts/session/login/",
            data=json.dumps({"username": "operator", "password": "AdminPass123!"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["isAuthenticated"])
        self.assertTrue(payload["isStaff"])
        self.assertEqual(payload["username"], "operator")

    def test_session_login_accepts_email_identifier(self):
        self.staff_user.email = "operator@example.com"
        self.staff_user.save(update_fields=["email"])

        response = self.client.post(
            "/accounts/session/login/",
            data=json.dumps({"username": "operator@example.com", "password": "AdminPass123!"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["isAuthenticated"])
        self.assertTrue(payload["isStaff"])
        self.assertEqual(payload["username"], "operator")
