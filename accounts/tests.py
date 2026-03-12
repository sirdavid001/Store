from django.test import TestCase


class AccountExperienceTests(TestCase):
    def test_login_page_renders_admin_copy_and_next_field(self):
        response = self.client.get("/accounts/login/?next=/secure-admin-portal-xyz/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Sign in to manage SirDavid Gadgets.")
        self.assertContains(response, 'name="next" value="/secure-admin-portal-xyz/"', html=False)
