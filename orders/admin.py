from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "sku", "quantity", "unit_price", "line_total")
    can_delete = False


@admin.action(description="Mark selected orders as processing")
def mark_processing(modeladmin, request, queryset):
    for order in queryset:
        order.status = Order.Status.PROCESSING
        order.save(update_fields=["status"])


@admin.action(description="Mark selected orders as shipped")
def mark_shipped(modeladmin, request, queryset):
    for order in queryset:
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])


@admin.action(description="Mark selected orders as delivered")
def mark_delivered(modeladmin, request, queryset):
    for order in queryset:
        order.status = Order.Status.DELIVERED
        order.save(update_fields=["status"])


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer_name",
        "status",
        "payment_method",
        "total_amount",
        "created_at",
    )
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    search_fields = (
        "order_number",
        "tracking_number",
        "email",
        "phone",
        "paystack_reference",
    )
    readonly_fields = (
        "order_number",
        "tracking_number",
        "paystack_reference",
        "paid_at",
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]
    actions = [mark_processing, mark_shipped, mark_delivered]

# Register your models here.
