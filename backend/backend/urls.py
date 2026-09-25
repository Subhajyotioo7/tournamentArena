"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponseRedirect
from django.views.decorators.http import require_GET
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl


@require_GET
def wallet_add_money_redirect(request):
    """Forward payment-provider callbacks to the React add-money page."""
    target = f"{settings.FRONTEND_URL.rstrip('/')}/wallet/add-money"
    parts = urlsplit(target)
    query = dict(parse_qsl(parts.query))
    query.update(request.GET.dict())
    destination = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )
    return HttpResponseRedirect(destination)

urlpatterns = [
    path("wallet/add-money", wallet_add_money_redirect),
    path("wallet/add-money/", wallet_add_money_redirect),
    path('admin/', admin.site.urls),
    path("api/", include("api.urls")),
    path("hostpartner/", include("hostpartner.urls")),
    path("tournaments/", include("tournaments.urls")),
    path("chat/", include("chat.urls")),
    path("wallet/", include("wallet.urls")),
    path("payments/", include("payments.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
