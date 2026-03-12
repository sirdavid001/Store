from decimal import Decimal, InvalidOperation

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.views.generic import DetailView, ListView

from .models import Category, Product


class ProductListView(ListView):
    model = Product
    template_name = "catalog/product_list.html"
    context_object_name = "products"
    paginate_by = 12

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("specifications")
        )
        self.category = None

        category_slug = self.kwargs.get("slug") or self.request.GET.get("category")
        if category_slug:
            self.category = get_object_or_404(Category, slug=category_slug)
            queryset = queryset.filter(category=self.category)

        query = self.request.GET.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(brand__icontains=query)
                | Q(short_description__icontains=query)
                | Q(description__icontains=query)
                | Q(specifications__label__icontains=query)
                | Q(specifications__value__icontains=query)
            ).distinct()

        min_price = self.request.GET.get("min_price")
        max_price = self.request.GET.get("max_price")
        try:
            if min_price:
                queryset = queryset.filter(price__gte=Decimal(min_price))
            if max_price:
                queryset = queryset.filter(price__lte=Decimal(max_price))
        except InvalidOperation:
            pass

        sort = self.request.GET.get("sort", "featured")
        sort_map = {
            "featured": ["-featured", "name"],
            "newest": ["-created_at"],
            "price_asc": ["price", "name"],
            "price_desc": ["-price", "name"],
            "name": ["name"],
        }
        return queryset.order_by(*sort_map.get(sort, sort_map["featured"]))

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["categories"] = Category.objects.all()
        context["selected_category"] = self.category
        context["filters"] = {
            "q": self.request.GET.get("q", "").strip(),
            "min_price": self.request.GET.get("min_price", ""),
            "max_price": self.request.GET.get("max_price", ""),
            "sort": self.request.GET.get("sort", "featured"),
        }
        context["breadcrumbs"] = [
            {"label": "Shop", "url": reverse("catalog:list")},
        ]
        if self.category:
            context["breadcrumbs"].append({"label": self.category.name, "url": None})
        return context


class ProductDetailView(DetailView):
    model = Product
    slug_field = "slug"
    slug_url_kwarg = "slug"
    template_name = "catalog/product_detail.html"
    context_object_name = "product"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("specifications")
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        product = self.object
        context["related_products"] = Product.objects.filter(
            is_active=True,
            category=product.category,
        ).exclude(pk=product.pk)[:4]
        context["breadcrumbs"] = [
            {"label": "Shop", "url": reverse("catalog:list")},
            {"label": product.category.name, "url": product.category.get_absolute_url()},
            {"label": product.name, "url": None},
        ]
        return context

# Create your views here.
