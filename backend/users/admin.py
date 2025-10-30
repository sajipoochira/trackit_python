from django.contrib import admin
from django.apps import apps

# Auto-register any models defined in this app (in case custom models are added later)
app_config = apps.get_app_config('users')
for model in app_config.get_models():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass
