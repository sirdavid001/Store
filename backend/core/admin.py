from django.conf import settings
from django.contrib import admin

admin.site.site_header = settings.STORE_NAME
admin.site.site_title = settings.STORE_NAME
admin.site.index_title = "Store operations"

# Register your models here.
