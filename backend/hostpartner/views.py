from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from .models import HostPartnerRequest


@api_view(["POST"])
@require_POST
@permission_classes([IsAuthenticated])
def request_host_partner_access(request):
    game = request.data.get("game")
    requested_tournament_name = request.data.get("requested_tournament_name")
    player_count = request.data.get("player_count")
    note = request.data.get("note", "")
    youtube_link = str(request.data.get("youtube_link", "")).strip()
    instagram_link = str(request.data.get("instagram_link", "")).strip()
    phone_number = str(request.data.get("phone_number", "")).strip()

    if not game or not requested_tournament_name or not youtube_link or not instagram_link:
        return Response({"error": "game, tournament name, YouTube link, and Instagram link are required"}, status=400)
    validator = URLValidator(schemes=["http", "https"])
    for label, value in (("YouTube", youtube_link), ("Instagram", instagram_link)):
        try:
            validator(value)
        except ValidationError:
            return Response({"error": f"Enter a valid {label} URL starting with http:// or https://"}, status=400)

    existing = HostPartnerRequest.objects.filter(requested_by=request.user).order_by("-created_at").first()
    if existing and existing.status == "pending":
        return Response({"error": "You already have a pending host-partner request"}, status=400)

    host_request = HostPartnerRequest.objects.create(
        requested_by=request.user,
        game=game,
        requested_tournament_name=requested_tournament_name,
        player_count=int(player_count or 0),
        note=note,
        youtube_link=youtube_link,
        instagram_link=instagram_link,
        phone_number=phone_number or None,
        status="pending",
    )

    return Response({
        "message": "Host partner request submitted successfully",
        "status": host_request.status,
        "request_id": str(host_request.id),
    }, status=201)


@api_view(["GET"])
@require_GET
@permission_classes([IsAuthenticated])
def my_host_partner_status(request):
    host_request = HostPartnerRequest.objects.filter(requested_by=request.user).order_by("-created_at").first()
    if not host_request:
        return Response({"status": "not_requested", "message": "No host-partner request found"})

    return Response({
        "status": host_request.status,
        "message": "Host partner request found",
        "request_id": str(host_request.id),
        "game": host_request.game,
        "requested_tournament_name": host_request.requested_tournament_name,
        "youtube_link": host_request.youtube_link,
        "instagram_link": host_request.instagram_link,
        "phone_number": host_request.phone_number,
    })


@api_view(["GET"])
@require_GET
@permission_classes([IsAdminUser])
def all_host_partner_requests(request):
    requests = HostPartnerRequest.objects.select_related("requested_by", "reviewed_by").all()
    payload = []
    for item in requests:
        payload.append({
            "id": str(item.id),
            "requested_by": item.requested_by.username,
            "game": item.game,
            "requested_tournament_name": item.requested_tournament_name,
            "player_count": item.player_count,
            "status": item.status,
            "note": item.note,
            "youtube_link": item.youtube_link,
            "instagram_link": item.instagram_link,
            "phone_number": item.phone_number,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })
    return Response({"results": payload})


@api_view(["POST"])
@require_POST
@permission_classes([IsAdminUser])
def approve_host_partner_request(request, request_id):
    host_request = get_object_or_404(HostPartnerRequest, pk=request_id)
    status_value = request.data.get("status", "approved")
    if status_value not in {"approved", "rejected"}:
        return Response({"error": "status must be approved or rejected"}, status=400)

    host_request.status = status_value
    host_request.reviewed_by = request.user
    host_request.reviewed_at = timezone.now()
    host_request.save()

    return Response({
        "message": f"Host partner request {status_value}",
        "status": host_request.status,
        "request_id": str(host_request.id),
    })
