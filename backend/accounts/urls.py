from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views
from .views import SignUpView, StoreLoginView

app_name = "accounts"

urlpatterns = [
    path("session/login/", views.session_login, name="session-login"),
    path("session/logout/", views.session_logout, name="session-logout"),
    path("login/", StoreLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("signup/", SignUpView.as_view(), name="signup"),
]
