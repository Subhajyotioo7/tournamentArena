import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

try:
    print("Running makemigrations...")
    call_command('makemigrations', 'wallet')
    print("Running migrate...")
    call_command('migrate', 'wallet')
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
