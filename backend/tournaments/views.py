from urllib import request
from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status as http_status

from payments.utils import create_razorpay_order, verify_signature
from wallet.models import Transaction, Profile
from .models import Tournament, Room, RoomParticipant, PrizeDistribution, RoomResult, TeamInvitation
from .serializers import RoomSerializer, TournamentSerializer, PrizeDistributionSerializer, RoomResultSerializer, TournamentParticipantSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_room(request, tournament_id):
    if not request.user.profile.game_id_verified:
        return Response({"error": "Game ID not verified"}, status=400)
    t = get_object_or_404(Tournament, pk=tournament_id)
    
    # 🎯 Check if room already exists (One Room per Tournament)
    if hasattr(t, "room"):
        serializer = RoomSerializer(t.room)
        return Response(serializer.data)

    # create room with current user as owner
    room = Room.objects.create(tournament=t, owner=request.user)
    serializer = RoomSerializer(room)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_room_solo(request, room_id):
    """Join room as solo player (pays full entry fee)"""
    if not request.user.profile.game_id_verified:
        return Response({"error": "Game ID not verified"}, status=400)
    
    room = get_object_or_404(Room, pk=room_id)
    
    # Check if already joined
    if RoomParticipant.objects.filter(room=room, user=request.user).exists():
        return Response({"error": "Already joined"}, status=400)
    
    # Check tournament capacity
    tournament = room.tournament
    total_participants = RoomParticipant.objects.filter(room__tournament=tournament).count()
    if total_participants >= tournament.max_participants:
        return Response({"error": "Tournament is full (Max participants reached)"}, status=400)
    
    # Get payment amount based on team mode
    tournament = room.tournament
    team_size = tournament.get_team_size()
    payment_share = tournament.entry_fee / team_size
    
    profile = request.user.profile
    
    # Check balance
    if profile.balance < payment_share:
        return Response({
            "error": "Insufficient balance",
            "required": str(payment_share),
            "balance": str(profile.balance)
        }, status=400)
    
    # Deduct and create participant
    profile.balance -= payment_share
    profile.save()
    
    Transaction.objects.create(
        profile=profile,
        tx_type="debit",
        amount=payment_share,
        note=f"Entry fee for {tournament.name} ({tournament.team_mode})"
    )
    
    RoomParticipant.objects.create(
        room=room,
        user=request.user,
        paid=True,
        is_team_leader=True,
        payment_share=payment_share
    )
    
    # Check if tournament is completely full
    if room.current_count() >= tournament.max_participants:
        room.status = "full"
        room.save()
    
    return Response({"message": "Joined successfully", "payment": str(payment_share)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_team_and_invite(request, room_id):
    """Create team and send invitations for duo/squad"""
    if not request.user.profile.game_id_verified:
        return Response({"error": "Game ID not verified"}, status=400)
    
    room = get_object_or_404(Room, pk=room_id)
    tournament = room.tournament
    team_size = tournament.get_team_size()
    
    if team_size == 1:
        return Response({"error": "This is a solo tournament"}, status=400)
    
    # Check if already joined
    if RoomParticipant.objects.filter(room=room, user=request.user).exists():
        return Response({"error": "Already joined"}, status=400)
    
    # Check tournament capacity
    total_participants = RoomParticipant.objects.filter(room__tournament=tournament).count()
    if total_participants + team_size > tournament.max_participants:
        return Response({"error": "Tournament is full (Not enough slots for team)"}, status=400)
    
    # Get invited game IDs
    game_ids = request.data.get('game_ids', [])
    required_invites = team_size - 1  # Exclude leader
    
    if len(game_ids) != required_invites:
        return Response({
            "error": f"Need exactly {required_invites} teammates for {tournament.team_mode}"
        }, status=400)
    
    # Create team leader participant (unpaid until all accept)
    payment_share = tournament.entry_fee / team_size
    
    leader_participant = RoomParticipant.objects.create(
        room=room,
        user=request.user,
        paid=False,
        is_team_leader=True,
        payment_share=payment_share
    )
    
    # Create invitations
    invitations = []
    for game_id in game_ids:
        # Try to find user by game_id
        try:
            invitee_profile = Profile.objects.get(game_id=game_id)
            invitee_user = invitee_profile.user
        except Profile.DoesNotExist:
            invitee_user = None
        
        invitation = TeamInvitation.objects.create(
            room=room,
            inviter=request.user,
            invitee_game_id=game_id,
            invitee=invitee_user
        )
        invitations.append({
            'id': str(invitation.id),
            'game_id': game_id,
            'status': invitation.status
        })
    
    return Response({
        "message": "Team created, invitations sent",
        "invitations": invitations,
        "payment_per_player": str(payment_share)
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invitations(request):
    """Get all pending invitations for current user"""
    user_game_id = request.user.profile.game_id
    
    invitations = TeamInvitation.objects.filter(
        invitee_game_id=user_game_id,
        status='pending'
    ).select_related('room', 'room__tournament', 'inviter')
    
    data = []
    for inv in invitations:
        tournament = inv.room.tournament
        payment_share = tournament.entry_fee / tournament.get_team_size()
        
        data.append({
            'id': str(inv.id),
            'tournament_name': tournament.name,
            'tournament_game': tournament.game,
            'team_mode': tournament.team_mode,
            'inviter_username': inv.inviter.username,
            'payment_share': str(payment_share),
            'created_at': inv.created_at,
            'room_id': str(inv.room.id)
        })
    
    return Response({'invitations': data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_invitation(request, invitation_id):
    """Accept team invitation and pay share"""
    invitation = get_object_or_404(TeamInvitation, pk=invitation_id)
    
    if invitation.status != 'pending':
        return Response({"error": "Invitation already processed"}, status=400)
    
    if invitation.invitee_game_id != request.user.profile.game_id:
        return Response({"error": "This invitation is not for you"}, status=403)
    
    room = invitation.room
    tournament = room.tournament
    payment_share = tournament.entry_fee / tournament.get_team_size()
    
    profile = request.user.profile
    
    # Check balance
    if profile.balance < payment_share:
        return Response({
            "error": "Insufficient balance",
            "required": str(payment_share)
        }, status=400)
    
    # Deduct payment
    profile.balance -= payment_share
    profile.save()
    
    Transaction.objects.create(
        profile=profile,
        tx_type="debit",
        amount=payment_share,
        note=f"Entry fee for {tournament.name} (Team member)"
    )
    
    # Create participant
    team_leader = invitation.inviter
    RoomParticipant.objects.create(
        room=room,
        user=request.user,
        paid=True,
        is_team_leader=False,
        team_leader=team_leader,
        payment_share=payment_share
    )
    
    # Update invitation
    invitation.status = 'accepted'
    invitation.invitee = request.user
    invitation.save()
    
    # Check if all team members have joined
    team_size = tournament.get_team_size()
    current_count = room.current_count()
    
    # If all accepted, charge team leader
    if current_count == team_size:
        leader_participant = RoomParticipant.objects.get(
            room=room,
            is_team_leader=True
        )
        
        if not leader_participant.paid:
            leader_profile = leader_participant.user.profile
            
            if leader_profile.balance >= payment_share:
                leader_profile.balance -= payment_share
                leader_profile.save()
                
                Transaction.objects.create(
                    profile=leader_profile,
                    tx_type="debit",
                    amount=payment_share,
                    note=f"Entry fee for {tournament.name} (Team leader)"
                )
                
                leader_participant.paid = True
                leader_participant.save()
                
                if room.current_count() >= tournament.max_participants:
                    room.status = "full"
                    room.save()
    
    return Response({
        "message": "Invitation accepted",
        "payment": str(payment_share),
        "team_complete": current_count == team_size
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_invitation(request, invitation_id):
    """Reject team invitation"""
    invitation = get_object_or_404(TeamInvitation, pk=invitation_id)
    
    if invitation.status != 'pending':
        return Response({"error": "Invitation already processed"}, status=400)
    
    if invitation.invitee_game_id != request.user.profile.game_id:
        return Response({"error": "This invitation is not for you"}, status=403)
    
    invitation.status = 'rejected'
    invitation.save()
    
    return Response({"message": "Invitation rejected"})


# Keep existing join_room for backward compatibility
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_room(request, room_id):
    """Legacy join room endpoint"""
    return join_room_solo(request, room_id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request, room_id):
    """Verify Razorpay payment"""
    razorpay_order_id = request.data.get("razorpay_order_id")
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_signature = request.data.get("razorpay_signature")
    
    if not verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        return Response({"error": "Invalid signature"}, status=400)
    
    rp = get_object_or_404(RoomParticipant, razorpay_order_id=razorpay_order_id)
    rp.razorpay_payment_id = razorpay_payment_id
    rp.paid = True
    rp.save()
    
    if rp.room.current_count() >= rp.room.tournament.get_team_size():
        rp.room.status = "full"
        rp.room.save()
    
    return Response({"message": "Payment verified & accepted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_rooms(request):
    """Get all rooms the current user has joined"""
    participations = RoomParticipant.objects.filter(user=request.user).select_related('room', 'room__tournament')
    rooms_data = []
    
    for participation in participations:
        room = participation.room
        rooms_data.append({
            'id': str(room.id),
            'tournament_name': room.tournament.name,
            'tournament_game': room.tournament.game,
            'status': room.status,
            'current_players': room.current_count(),
            'max_players': room.tournament.get_team_size(),
            'prize_pool': str(room.total_prize_pool()),
            'joined_at': participation.joined_at,
            'paid': participation.paid,
            'entry_fee': str(room.tournament.entry_fee),
        })
    
    return Response({'rooms': rooms_data})


class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = []  # Allow anyone to view tournaments


@api_view(["POST"])
@permission_classes([IsAdminUser])  
def create_tournament(request):
    serializer = TournamentSerializer(data=request.data)
    if serializer.is_valid():
        tournament = serializer.save()
        
        # 🎯 Auto-create room for the tournament
        Room.objects.create(tournament=tournament, owner=request.user)
        
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# ============= PRIZE DISTRIBUTION ENDPOINTS =============

@api_view(["POST"])
@permission_classes([IsAdminUser])
def set_prize_distribution(request, tournament_id):
    """Set prize distribution for a tournament"""
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    distributions = request.data.get('distributions', [])
    
    # Delete existing distributions
    PrizeDistribution.objects.filter(tournament=tournament).delete()
    
    # Create new distributions
    for dist in distributions:
        PrizeDistribution.objects.create(
            tournament=tournament,
            rank=dist['rank'],
            prize_amount=dist['prize_amount']
        )
    
    return Response({"message": "Prize distribution set successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_prize_distribution(request, tournament_id):
    """Get prize distribution for a tournament"""
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    distributions = PrizeDistribution.objects.filter(tournament=tournament)
    serializer = PrizeDistributionSerializer(distributions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_tournament_participants(request, tournament_id):
    """Get all participants for a tournament (Admin only)"""
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    participants = RoomParticipant.objects.filter(room__tournament=tournament).select_related('user', 'user__profile', 'room')
    serializer = TournamentParticipantSerializer(participants, many=True)
    return Response(serializer.data)


# ============= RESULT DECLARATION ENDPOINTS =============

@api_view(["POST"])
@permission_classes([IsAdminUser])
def declare_results(request, room_id):
    """Declare results for a room"""
    room = get_object_or_404(Room, pk=room_id)
    results_data = request.data.get('results', [])
    
    for result in results_data:
        participant = get_object_or_404(RoomParticipant, pk=result['participant_id'])
        rank = result['rank']
        
        # Calculate prize amount
        prize_dist = PrizeDistribution.objects.filter(
            tournament=room.tournament,
            rank=rank
        ).first()
        
        if prize_dist:
            prize_amount = prize_dist.calculate_prize_amount(room.total_prize_pool())
        else:
            prize_amount = 0
        
        RoomResult.objects.update_or_create(
            room=room,
            participant=participant,
            defaults={
                'rank': rank,
                'prize_amount': prize_amount
            }
        )
    
    room.status = "completed"
    room.save()
    
    return Response({"message": "Results declared successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_results(request, room_id):
    """Get results for a room"""
    room = get_object_or_404(Room, pk=room_id)
    results = RoomResult.objects.filter(room=room)
    serializer = RoomResultSerializer(results, many=True)
    return Response(serializer.data)


# ============= PAYOUT APPROVAL ENDPOINTS =============

@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_payouts(request, room_id):
    """Approve all pending payouts for a room"""
    from django.db import transaction
    from django.utils import timezone
    
    room = get_object_or_404(Room, pk=room_id)
    pending_results = RoomResult.objects.filter(room=room, payout_status='pending')
    
    with transaction.atomic():
        for result in pending_results:
            # Credit winner's wallet
            profile = result.participant.user.profile
            profile.balance += result.prize_amount
            profile.save()
            
            # Create transaction record
            Transaction.objects.create(
                profile=profile,
                tx_type='credit',
                amount=result.prize_amount,
                note=f'Prize for Rank {result.rank} in {room.tournament.name}'
            )
            
            # Update payout status
            result.payout_status = 'paid'
            result.approved_by = request.user
            result.approved_at = timezone.now()
            result.save()
    
    return Response({"message": f"Approved {pending_results.count()} payouts"})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def pending_payouts(request):
    """Get all pending payouts"""
    pending = RoomResult.objects.filter(payout_status='pending').select_related(
        'room', 'room__tournament', 'participant', 'participant__user'
    )
    
    serializer = RoomResultSerializer(pending, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_room_detail(request, room_id):
    """Get detailed room information including participants and results"""
    room = get_object_or_404(Room, pk=room_id)
    tournament = room.tournament
    
    # Check if user is a participant
    is_participant = RoomParticipant.objects.filter(room=room, user=request.user).exists()
    
    # Get all participants
    participants_data = []
    for participant in room.participants.all():
        participants_data.append({
            'id': str(participant.id),
            'username': participant.user.username,
            'game_id': participant.user.profile.game_id,
            'team_name': None,  # Original system doesn't have team_name field
            'is_team_leader': participant.is_team_leader,
            'joined_at': participant.joined_at
        })
    
    # Get results if they exist
    results_data = []
    for result in room.results.all().order_by('rank'):
        results_data.append({
            'rank': result.rank,
            'username': result.participant.user.username,
            'prize_amount': str(result.prize_amount),
            'payout_status': result.payout_status
        })
    
    room_data = {
        'id': str(room.id),
        'room_number': 1,  # Original system doesn't have room_number
        'tournament_name': tournament.name,
        'game': tournament.game,
        'status': room.status,
        'current_players': room.current_count(),
        'max_players': tournament.get_team_size(),
        'entry_fee': str(tournament.entry_fee),
        'prize_pool': str(room.total_prize_pool()),
        'participants': participants_data,
        'results': results_data,
        'is_participant': is_participant
    }
    
    return Response(room_data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def add_single_winner(request, room_id):
    """Add a winner to a room and credit their wallet immediately"""
    from django.db import transaction
    from django.utils import timezone
    
    room = get_object_or_404(Room, pk=room_id)
    participant_id = request.data.get('participant_id')
    rank = request.data.get('rank')
    prize_amount = Decimal(str(request.data.get('prize_amount', 0)))
    
    if prize_amount <= 0:
        return Response({"error": "Invalid prize amount"}, status=400)
    
    participant = get_object_or_404(RoomParticipant, pk=participant_id, room=room)
    
    with transaction.atomic():
        # 1. Create or update result
        result, created = RoomResult.objects.update_or_create(
            room=room,
            participant=participant,
            defaults={
                'rank': rank,
                'prize_amount': prize_amount,
                'payout_status': 'paid',
                'approved_by': request.user,
                'approved_at': timezone.now()
            }
        )
        
        # 2. Credit wallet
        profile = participant.user.profile
        profile.balance += prize_amount
        profile.save()
        
        # 3. Create transaction
        Transaction.objects.create(
            profile=profile,
            tx_type='credit',
            amount=prize_amount,
            note=f'Winner Rank {rank} in {room.tournament.name}'
        )
    
    return Response({"message": f"Winner added! ₹{prize_amount} added to {participant.user.username}'s wallet."})
