from django.urls import path

from . import views

app_name = "orders"

urlpatterns = [
    path("track/", views.track_order, name="track"),
    path("history/", views.order_history, name="history"),
    path("confirmation/<str:order_number>/", views.order_confirmation, name="confirmation"),
]
