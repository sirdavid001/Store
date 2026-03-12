from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path("callback/", views.payment_callback, name="callback"),
    path("status/<str:reference>/", views.payment_status, name="status"),
    path("webhook/", views.paystack_webhook, name="webhook"),
]
