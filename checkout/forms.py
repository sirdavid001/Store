from django import forms

from core.forms import StyledFormMixin


class CustomerInformationForm(StyledFormMixin, forms.Form):
    first_name = forms.CharField(max_length=80)
    last_name = forms.CharField(max_length=80)
    email = forms.EmailField()
    phone = forms.CharField(max_length=30)
    verification_code = forms.CharField(max_length=6, required=False)


class ShippingAddressForm(StyledFormMixin, forms.Form):
    address_line1 = forms.CharField(max_length=255)
    address_line2 = forms.CharField(max_length=255, required=False)
    city = forms.CharField(max_length=120)
    state = forms.CharField(max_length=120)
    country = forms.CharField(max_length=120, initial="Nigeria")
    postal_code = forms.CharField(max_length=30, required=False)
    delivery_instructions = forms.CharField(required=False, widget=forms.Textarea)


class PaymentMethodForm(StyledFormMixin, forms.Form):
    payment_method = forms.ChoiceField(
        choices=[
            ("card", "Card payment"),
            ("bank_transfer", "Bank transfer"),
            ("ussd", "USSD"),
            ("apple_pay", "Apple Pay"),
        ]
    )

    def __init__(self, *args, apple_capable=False, **kwargs):
        super().__init__(*args, **kwargs)
        if not apple_capable:
            self.fields["payment_method"].choices = [
                choice for choice in self.fields["payment_method"].choices if choice[0] != "apple_pay"
            ]
