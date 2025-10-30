from django.contrib import admin
from django.apps import apps

# Automatically register all models in the finance app with the Django admin.
app_config = apps.get_app_config('finance')
for model in app_config.get_models():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        # Model already registered elsewhere
        pass

