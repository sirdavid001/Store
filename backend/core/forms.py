from django import forms


class StyledFormMixin:
    input_classes = "form-input"
    checkbox_classes = "form-checkbox"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields.values():
            widget = field.widget
            current_class = widget.attrs.get("class", "")

            if isinstance(widget, forms.CheckboxInput):
                widget.attrs["class"] = f"{current_class} {self.checkbox_classes}".strip()
                continue

            widget.attrs["class"] = f"{current_class} {self.input_classes}".strip()

            if isinstance(widget, forms.Textarea):
                widget.attrs.setdefault("rows", 4)


class ContactForm(StyledFormMixin, forms.Form):
    name = forms.CharField(max_length=120)
    email = forms.EmailField()
    subject = forms.CharField(max_length=150)
    message = forms.CharField(widget=forms.Textarea)
