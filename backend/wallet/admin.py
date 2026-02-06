from django.contrib import admin
from .models import Profile, Transaction, Withdrawal, SiteConfiguration

# Register your models here.

admin.site.register(Profile)
admin.site.register(Transaction)
admin.site.register(Withdrawal)
admin.site.register(SiteConfiguration)
