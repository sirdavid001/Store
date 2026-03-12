from django.urls import path

from . import views

app_name = "checkout"

urlpatterns = [
    path("customer/", views.customer_step, name="customer"),
    path("address/", views.address_step, name="address"),
    path("payment/", views.payment_step, name="payment"),
    path("review/", views.review_step, name="review"),
]
