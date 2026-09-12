from django.urls import path

from . import views

urlpatterns = [
    path("request/", views.request_host_partner_access, name="host_partner_request"),
    path("me/", views.my_host_partner_status, name="host_partner_status"),
    path("requests/", views.all_host_partner_requests, name="host_partner_requests"),
    path("request/<uuid:request_id>/approve/", views.approve_host_partner_request, name="host_partner_approve"),
]
