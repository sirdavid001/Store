import json

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.views import LoginView
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.decorators.http import require_POST
from django.views.generic import CreateView

from .forms import LoginForm, SignUpForm

User = get_user_model()


def _session_payload(request):
    is_authenticated = request.user.is_authenticated
    username = request.user.get_username() if is_authenticated else ""
    display_name = request.user.get_full_name() if is_authenticated else ""
    return {
        "isAuthenticated": is_authenticated,
        "isStaff": bool(is_authenticated and request.user.is_staff),
        "username": username,
        "email": request.user.email if is_authenticated else "",
        "displayName": display_name or username,
        "role": "staff" if is_authenticated and request.user.is_staff else "customer",
        "loginUrl": reverse_lazy("accounts:login"),
        "logoutUrl": reverse_lazy("accounts:logout"),
    }


@require_POST
def session_login(request):
    try:
        payload = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid login payload."}, status=400)

    identifier = (payload.get("username") or payload.get("email") or "").strip()
    username = identifier
    matched_user = None
    if "@" in identifier:
        matched_user = User.objects.filter(email__iexact=identifier).only("username", "is_staff", "is_active").first()
        if matched_user:
            username = matched_user.get_username()
    else:
        matched_user = User.objects.filter(username__iexact=identifier).only("username", "is_staff", "is_active").first()

    if not matched_user:
        return JsonResponse(
            {
                "message": "No admin account matches that email or username.",
                "code": "no_account",
            },
            status=400,
        )

    if not matched_user.is_active or not matched_user.is_staff:
        return JsonResponse(
            {
                "message": "This account has not been provisioned for admin portal access.",
                "code": "incomplete_setup",
            },
            status=403,
        )

    form = LoginForm(
        request,
        data={
            "username": username,
            "password": payload.get("password") or "",
        },
    )
    if not form.is_valid():
        return JsonResponse(
            {
                "message": "Invalid username or password.",
                "code": "wrong_password",
            },
            status=400,
        )

    auth_login(request, form.get_user())
    return JsonResponse(_session_payload(request))


@require_POST
def session_logout(request):
    auth_logout(request)
    return JsonResponse(_session_payload(request))


class StoreLoginView(LoginView):
    template_name = "registration/login.html"
    authentication_form = LoginForm
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        next_target = (
            self.get_redirect_url()
            or self.request.POST.get(self.redirect_field_name, "")
            or self.request.GET.get(self.redirect_field_name, "")
        )
        context.update(
            {
                "next_target": next_target,
                "is_admin_login": "secure-admin-portal-xyz" in next_target,
                "storefront_url": settings.SITE_URL.rstrip("/") or "/",
            }
        )
        return context


class SignUpView(CreateView):
    template_name = "registration/signup.html"
    form_class = SignUpForm
    success_url = reverse_lazy("accounts:login")

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, "Account created. You can now log in to see future orders.")
        return response

# Create your views here.
