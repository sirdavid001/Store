from django.urls import path

from .views import ProductDetailView, ProductListView

app_name = "catalog"

urlpatterns = [
    path("", ProductListView.as_view(), name="list"),
    path("category/<slug:slug>/", ProductListView.as_view(), name="category"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="detail"),
]
