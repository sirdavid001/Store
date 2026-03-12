from django import forms

from core.forms import StyledFormMixin


class OrderTrackingForm(StyledFormMixin, forms.Form):
    order_id = forms.CharField(label="Order ID / tracking number", max_length=40)
    email = forms.EmailField()
