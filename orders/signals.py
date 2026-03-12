from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Order
from .services import send_order_status_email


@receiver(pre_save, sender=Order)
def store_previous_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_status = Order.objects.filter(pk=instance.pk).values_list(
            "status", flat=True
        ).first()


@receiver(post_save, sender=Order)
def trigger_status_email(sender, instance, created, **kwargs):
    previous_status = getattr(instance, "_previous_status", None)
    if created or not previous_status or previous_status == instance.status:
        return
    send_order_status_email(instance)
