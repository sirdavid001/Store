from django.contrib import admin

from .models import Category, Product, ProductSpecification


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "featured")
    list_filter = ("featured",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "stock_quantity",
        "featured",
        "is_active",
        "updated_at",
    )
    list_filter = ("category", "featured", "is_active")
    list_editable = ("price", "stock_quantity", "featured", "is_active")
    search_fields = ("name", "brand", "sku", "short_description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductSpecificationInline]

# Register your models here.
