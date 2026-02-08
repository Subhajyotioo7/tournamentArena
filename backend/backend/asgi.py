import os
import django

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

# ✅ MUST be first
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# ✅ Explicitly setup Django BEFORE importing consumers
django.setup()

# ✅ Now it is safe to import routing
import chat.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
