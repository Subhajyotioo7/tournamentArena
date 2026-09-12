from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import HostPartnerRequest


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_host_partner_access(request):
    game = request.data.get("game")
    requested_tournament_name = request.data.get("requested_tournament_name")
    player_count = request.data.get("player_count")
    note = request.data.get("note", "")

    if not game or not requested_tournament_name:
        return Response({"error": "game and requested_tournament_name are required"}, status=400)

    existing = HostPartnerRequest.objects.filter(requested_by=request.user).order_by("-created_at").first()
    if existing and existing.status == "pending":
        return Response({"error": "You already have a pending host-partner request"}, status=400)

    host_request = HostPartnerRequest.objects.create(
        requested_by=request.user,
        game=game,
        requested_tournament_name=requested_tournament_name,
        player_count=int(player_count or 0),
        note=note,
        status="pending",
    )

    return Response({
        "message": "Host partner request submitted successfully",
        "status": host_request.status,
        "request_id": str(host_request.id),
    }, status=201)


@api_view(["GET"])
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
    })


@api_view(["GET"])
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
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })
    return Response({"results": payload})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_host_partner_request(request, request_id):
    host_request = get_object_or_404(HostPartnerRequest, pk=request_id)
    status_value = request.data.get("status", "approved")
    if status_value not in {"approved", "rejected"}:
        return Response({"error": "status must be approved or rejected"}, status=400)

    host_request.status = status_value
    host_request.reviewed_by = request.user
    host_request.reviewed_at = __import__("django.utils.timezone").utils.timezone.now()
    host_request.save()

    return Response({
        "message": f"Host partner request {status_value}",
        "status": host_request.status,
        "request_id": str(host_request.id),
    })
