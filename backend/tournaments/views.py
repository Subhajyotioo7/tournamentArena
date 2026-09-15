from urllib import request
from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status as http_status

from wallet.models import Transaction, Profile
from hostpartner.models import HostPartnerRequest
from .models import Tournament, Room, RoomParticipant, PrizeDistribution, RoomResult, TeamInvitation, TournamentEarning
from .serializers import RoomSerializer, TournamentSerializer, PrizeDistributionSerializer, RoomResultSerializer, TournamentParticipantSerializer
from django.db import transaction
from django.db.models import Q
from django.utils import timezone


def is_game_id_verified(profile):
    return profile.game_id_verified or profile.game_id_status == "approved"


def game_id_field(game):
    return {"bgmi": "bgmi_id", "freefire": "freefire_id", "fifa": "fifa_id"}.get(game)


def profile_game_id(profile, game):
    field = game_id_field(game)
    value = getattr(profile, field, None) if field else None
    return value.strip() if isinstance(value, str) else value


def credit_tournament_creator(tournament, participant, amount):
    if not tournament.created_by_id or amount <= 0:
        return
    creator_profile, _ = Profile.objects.get_or_create(user_id=tournament.created_by_id)
    creator_profile.balance += amount
    creator_profile.save(update_fields=["balance"])
    TournamentEarning.objects.create(
        tournament=tournament,
        participant=participant,
        organizer=tournament.created_by,
        amount=amount,
    )
    Transaction.objects.create(
        profile=creator_profile,
        tx_type="credit",
        amount=amount,
        note=f"Entry fee from {participant.user.username}: {tournament.name}",
    )

def _validate_br_tournament(request, team_mode, custom_player_count):
    approved_request = HostPartnerRequest.objects.filter(
        requested_by=request.user,
        status='approved',
    ).order_by('-created_at').first()
    if not approved_request:
        return None, Response({
            "error": "Only approved host partners can create BR / long tournaments. Request access first."
        }, status=403)
    team_size = {"solo": 1, "duo": 2, "squad": 4}.get(team_mode)
    if not team_size:
        return None, Response({"error": "Invalid BR team mode"}, status=400)
    if custom_player_count < team_size or custom_player_count % team_size != 0:
        return None, Response({
            "error": f"BR player count must be a multiple of {team_size} for {team_mode} mode"
        }, status=400)
    return approved_request, None


def _prize_pool(prize_distributions):
    return sum(
        (Decimal(str(dist.get('prize', 0))) for dist in prize_distributions),
        Decimal("0.00"),
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_room(request, tournament_id):
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
    room = get_object_or_404(Room, pk=room_id)
    if not is_game_id_verified(request.user.profile) or not profile_game_id(request.user.profile, room.tournament.game):
        return Response({"error": f"Please add and verify your {room.tournament.game.upper()} ID in your profile first."}, status=400)
    
    # Check if already joined
    existing_participant = RoomParticipant.objects.filter(room=room, user=request.user).first()
    if existing_participant:
        return Response({
            "message": "You have already joined this tournament.",
            "already_joined": True,
            "payment": str(existing_participant.payment_share),
        })
    if TeamInvitation.objects.filter(room=room, inviter=request.user, status='pending').exists():
        return Response({"error": "Your team is waiting for teammates to accept."}, status=400)
    
    # Check tournament capacity
    tournament = room.tournament
    total_participants = RoomParticipant.objects.filter(room__tournament=tournament).count()
    if total_participants >= tournament.max_participants:
        return Response({"error": "Tournament is full (Max participants reached)"}, status=400)
    
    # BR entrants pay the full entry fee; regular team tournaments split it.
    tournament = room.tournament
    team_size = tournament.get_team_size()
    payment_share = (
        tournament.entry_fee
        if tournament.tournament_type == "br"
        else tournament.entry_fee / team_size
    )
    
    profile = request.user.profile
    
    # Check balance
    if profile.balance < payment_share:
        return Response({
            "error": "Insufficient balance",
            "required": str(payment_share),
            "balance": str(profile.balance)
        }, status=400)
    
    # Deduct and create participant
    with transaction.atomic():
        profile.balance -= payment_share
        profile.save(update_fields=["balance"])
        Transaction.objects.create(
            profile=profile, tx_type="debit", amount=payment_share,
            note=f"Entry fee for {tournament.name} ({tournament.team_mode})"
        )
        participant = RoomParticipant.objects.create(
            room=room, user=request.user, paid=True,
            is_team_leader=True, payment_share=payment_share
        )
        credit_tournament_creator(tournament, participant, payment_share)
    
    # Check if tournament is completely full
    if room.current_count() >= tournament.max_participants:
        room.status = "full"
        room.save()
    
    return Response({"message": "Joined successfully", "payment": str(payment_share)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_team_and_invite(request, room_id):
    """Create team and send invitations for duo/squad"""
    if not is_game_id_verified(request.user.profile):
        return Response({"error": "Game ID not verified"}, status=400)
    
    room = get_object_or_404(Room, pk=room_id)
    tournament = room.tournament
    tournament_game_id = profile_game_id(request.user.profile, tournament.game)
    if not tournament_game_id:
        return Response({"error": f"Please add your {tournament.game.upper()} ID in your profile first."}, status=400)
    team_size = tournament.get_team_size()
    
    if team_size == 1:
        return Response({"error": "This is a solo tournament"}, status=400)
    
    # Check if already joined
    if RoomParticipant.objects.filter(room=room, user=request.user).exists():
        return Response({"error": "Already joined"}, status=400)
    if TeamInvitation.objects.filter(room=room, inviter=request.user, status='pending').exists():
        return Response({"error": "Your team is already waiting for teammates to accept."}, status=400)
    
    # Check tournament capacity
    total_participants = RoomParticipant.objects.filter(room__tournament=tournament).count()
    if total_participants + team_size > tournament.max_participants:
        return Response({"error": "Tournament is full (Not enough slots for team)"}, status=400)
    
    # Get invited game IDs
    game_ids = [
        game_id.strip() for game_id in request.data.get('game_ids', [])
        if isinstance(game_id, str) and game_id.strip()
    ]
    payment_type = request.data.get('payment_type', 'split_equally')
    if payment_type not in ('leader_pays_all', 'split_equally'):
        return Response({"error": "Invalid team payment option"}, status=400)
    required_invites = team_size - 1  # Max allowed
    
    if len(game_ids) != required_invites:
        return Response({
            "error": f"Invite exactly {required_invites} teammate(s) for {tournament.team_mode}"
        }, status=400)
    
    team_fee = tournament.entry_fee
    leader_fee = team_fee if payment_type == 'leader_pays_all' else team_fee / team_size
    profile = request.user.profile
    
    # Check if leader has enough balance for full team
    if profile.balance < leader_fee:
        return Response({
            "error": "Insufficient balance to create team",
            "required": str(leader_fee),
            "your_balance": str(profile.balance)
        }, status=400)
    
    # Deduct full team fee from leader's wallet
    with transaction.atomic():
        profile.balance -= leader_fee
        profile.save()
        
        # Record transaction
        Transaction.objects.create(
            profile=profile,
            tx_type="debit",
            amount=leader_fee,
            note=f"Team entry fee ({payment_type}) for {tournament.name} ({tournament.team_mode})"
        )
        
        # The leader has paid their share, so record it immediately for the
        # organizer. Teammate payments are recorded when invitations are accepted.
        participant = RoomParticipant.objects.create(
            room=room,
            user=request.user,
            paid=True,
            is_team_leader=True,
            payment_share=leader_fee
        )
        credit_tournament_creator(tournament, participant, leader_fee)
        room.payment_type = payment_type
        room.save(update_fields=['payment_type'])
    
        # Create invitations
        invitations = []
        for game_id in game_ids:
            # Try to find user by game_id
            try:
                invitee_profile = Profile.objects.get(**{game_id_field(tournament.game): game_id})
                invitee_user = invitee_profile.user
            except (Profile.DoesNotExist, Profile.MultipleObjectsReturned):
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
        "message": f"Team created! You paid ₹{leader_fee} now. Waiting for teammates to accept.",
        "invitations": invitations,
        "total_paid": str(leader_fee),
        "payment_type": payment_type,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invitations(request):
    """Get all pending invitations for current user"""
    profile = request.user.profile
    game_id_values = [value for value in (
        profile.bgmi_id, profile.freefire_id, profile.fifa_id, profile.game_id
    ) if value]
    invitations = TeamInvitation.objects.filter(
        status='pending',
        invitee_game_id__in=[value.strip() for value in game_id_values],
    ).select_related('room', 'room__tournament', 'inviter')
    
    data = []
    for inv in invitations:
        tournament = inv.room.tournament
        if profile_game_id(profile, tournament.game) != inv.invitee_game_id.strip():
            continue
        payment_share = tournament.entry_fee / tournament.get_team_size()
        
        data.append({
            'id': str(inv.id),
            'tournament_name': tournament.name,
            'tournament_game': tournament.game,
            'team_mode': tournament.team_mode,
            'inviter_username': inv.inviter.username,
            'payment_share': str(payment_share),
            'payment_type': inv.room.payment_type,
            'created_at': inv.created_at,
            'room_id': str(inv.room.id)
        })
    
    return Response({'invitations': data})

def _invitation_payment_share(invitation, tournament, room):
    if room.payment_type == 'leader_pays_all':
        return Decimal("0")
    leader_participant = RoomParticipant.objects.filter(
        room=room, user=invitation.inviter, is_team_leader=True
    ).first()
    if leader_participant and leader_participant.payment_share >= tournament.entry_fee:
        return Decimal("0")
    return tournament.entry_fee / tournament.get_team_size()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_invitation(request, invitation_id):
    """Accept team invitation and pay share"""
    try:
        invitation = get_object_or_404(TeamInvitation, pk=invitation_id)
        
        if invitation.status != 'pending':
            return Response({"error": "Invitation already processed"}, status=400)
        
        # Check if invitation is for the current user by matching game IDs
        profile = request.user.profile
        user_game_ids = [profile_game_id(profile, invitation.room.tournament.game)]
        
        if invitation.invitee_game_id not in user_game_ids:
            return Response({
                "error": "This invitation is not for you",
                "invited_game_id": invitation.invitee_game_id,
                "your_game_ids": [gid for gid in user_game_ids if gid]
            }, status=403)
        
        room = invitation.room
        tournament = room.tournament
        team_size = tournament.get_team_size()
        
        payment_share = _invitation_payment_share(invitation, tournament, room)
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Check if user is already a participant
            existing_participant = RoomParticipant.objects.filter(
                room=room,
                user=request.user
            ).first()
            
            if existing_participant:
                # User already joined, just update invitation status
                invitation.status = 'accepted'
                invitation.invitee = request.user
                invitation.save()
                
                return Response({
                    "message": "You are already part of this team",
                    "payment": str(existing_participant.payment_share),
                    "team_complete": room.current_count() == team_size
                })
            
            if payment_share:
                if profile.balance < payment_share:
                    return Response({
                        "error": "Insufficient balance to accept this invitation",
                        "required": str(payment_share),
                        "balance": str(profile.balance),
                    }, status=400)
                profile.balance -= payment_share
                profile.save()
                Transaction.objects.create(
                    profile=profile,
                    tx_type="debit",
                    amount=payment_share,
                    note=f"Team entry fee for {tournament.name} ({tournament.team_mode})"
                )

            team_leader = invitation.inviter
            participant = RoomParticipant.objects.create(
                room=room,
                user=request.user,
                paid=True,
                is_team_leader=False,
                team_leader=team_leader,
                payment_share=payment_share
            )
            credit_tournament_creator(tournament, participant, payment_share)
            
            # Update invitation
            invitation.status = 'accepted'
            invitation.invitee = request.user
            invitation.save()
            
            # Check if team is complete
            accepted_invites = room.invitations.filter(status='accepted').count()
            team_complete = accepted_invites == team_size - 1

            # In split mode the captain's place remains pending until every
            # teammate has accepted and paid their share.
            if team_complete and room.payment_type == 'split_equally':
                RoomParticipant.objects.get_or_create(
                    room=room,
                    user=team_leader,
                    defaults={
                        'paid': True,
                        'is_team_leader': True,
                        'payment_share': tournament.entry_fee / team_size,
                    },
                )
            
            # If team is full, mark room as full
            if room.current_count() >= tournament.max_participants:
                room.status = "full"
                room.save()
        
        
        # Get leader's game ID for display
        leader_profile = team_leader.profile
        leader_game_id = profile_game_id(leader_profile, tournament.game)
        
        return Response({
            "message": "Invitation accepted! You joined the team." if not payment_share else f"Invitation accepted! ₹{payment_share} was charged.",
            "payment_status": "FREE" if not payment_share else str(payment_share),
            "leader_paid": room.payment_type == 'leader_pays_all',
            "leader_game_id": leader_game_id,
            "leader_username": team_leader.username,
            "team_complete": team_complete
        })
    
    except Exception as e:
        import traceback
        return Response({
            "error": "An error occurred while accepting invitation",
            "details": str(e),
            "traceback": traceback.format_exc()
        }, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_invitation(request, invitation_id):
    """Reject team invitation"""
    invitation = get_object_or_404(TeamInvitation, pk=invitation_id)
    
    if invitation.status != 'pending':
        return Response({"error": "Invitation already processed"}, status=400)
    
    if invitation.invitee_game_id != profile_game_id(request.user.profile, invitation.room.tournament.game):
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_rooms(request):
    """Get rooms the current user joined or owns as a tournament creator."""
    participations = RoomParticipant.objects.filter(user=request.user).select_related('room', 'room__tournament')
    rooms_data = []
    seen_rooms = set()
    
    for participation in participations:
        room = participation.room
        seen_rooms.add(room.id)
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
            'is_owner': room.owner_id == request.user.id,
            'team_mode': room.tournament.team_mode,
            'payment_type': room.payment_type,
            'has_pending_invites': room.invitations.filter(status='pending').exists(),
        })

    for room in Room.objects.filter(owner=request.user).select_related('tournament'):
        if room.id in seen_rooms:
            continue
        rooms_data.append({
            'id': str(room.id),
            'tournament_name': room.tournament.name,
            'tournament_game': room.tournament.game,
            'status': room.status,
            'current_players': room.current_count(),
            'max_players': room.tournament.get_team_size(),
            'prize_pool': str(room.total_prize_pool()),
            'joined_at': room.created_at,
            'paid': False,
            'entry_fee': str(room.tournament.entry_fee),
            'is_owner': True,
            'team_mode': room.tournament.team_mode,
            'payment_type': room.payment_type,
            'has_pending_invites': room.invitations.filter(status='pending').exists(),
        })
    
    return Response({'rooms': rooms_data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_created_tournament_earnings(request):
    """Show the authenticated organizer's players, totals, and earning history."""
    tournaments = Tournament.objects.filter(created_by=request.user).order_by("-created_at")
    earnings = TournamentEarning.objects.filter(
        organizer=request.user
    ).select_related("tournament", "participant__user")
    tournament_data = []
    for tournament in tournaments:
        tournament_earnings = earnings.filter(tournament=tournament)
        tournament_data.append({
            "id": tournament.id,
            "name": tournament.name,
            "game": tournament.game,
            "entry_fee": str(tournament.entry_fee),
            "created_at": tournament.created_at,
            "total_players": tournament_earnings.count(),
            "total_earned": str(sum(
                (item.amount for item in tournament_earnings), Decimal("0.00")
            )),
        })
    history = [{
        "id": earning.id,
        "tournament_id": earning.tournament_id,
        "tournament_name": earning.tournament.name,
        "player": earning.participant.user.username,
        "amount": str(earning.amount),
        "created_at": earning.created_at,
    } for earning in earnings]
    return Response({
        "total_tournaments": len(tournament_data),
        "total_players": len(history),
        "total_earned": str(sum(
            (earning.amount for earning in earnings), Decimal("0.00")
        )),
        "tournaments": tournament_data,
        "history": history,
    })


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
@permission_classes([IsAuthenticated])
def get_tournament_participants(request, tournament_id):
    """Get tournament participants for the owner, staff, or tournament viewers."""
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    can_manage = request.user.is_staff or request.user.is_superuser or tournament.created_by_id == request.user.id
    participants = RoomParticipant.objects.filter(room__tournament=tournament).select_related('user', 'user__profile', 'room')
    serializer = TournamentParticipantSerializer(participants, many=True)
    return Response({
        "participants": serializer.data,
        "can_manage": can_manage,
        "team_mode": tournament.team_mode,
    })


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
    teams = {}
    for participant in room.participants.all():
        team_id = str(participant.team_leader_id or participant.user_id)
        participants_data.append({
            'id': str(participant.id),
            'username': participant.user.username,
            'game_id': profile_game_id(participant.user.profile, tournament.game),
            'team_id': team_id,
            'team_leader_username': (participant.team_leader or participant.user).username,
            'is_team_leader': participant.is_team_leader,
            'paid': participant.paid,
            'payment_share': str(participant.payment_share),
            'joined_at': participant.joined_at
        })
        team = teams.setdefault(team_id, {
            'id': team_id,
            'leader_username': (participant.team_leader or participant.user).username,
            'members': [],
        })
        team['members'].append(participants_data[-1])
    invitations_data = [{
        'id': str(inv.id),
        'game_id': inv.invitee_game_id,
        'status': inv.status,
        'invitee_username': inv.invitee.username if inv.invitee else None,
        'inviter_username': inv.inviter.username,
    } for inv in room.invitations.all()]

    for invitation in room.invitations.all():
        team_id = str(invitation.inviter_id)
        team = teams.setdefault(team_id, {
            'id': team_id,
            'leader_username': invitation.inviter.username,
            'members': [],
        })
        if not any(member.get('game_id') == invitation.invitee_game_id for member in team['members']):
            team['members'].append({
                'id': str(invitation.id),
                'username': invitation.invitee.username if invitation.invitee else invitation.invitee_game_id,
                'game_id': invitation.invitee_game_id,
                'status': invitation.status,
                'is_invitation': True,
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
        'payment_type': room.payment_type,
        'tournament_game': tournament.game,
        'team_mode': tournament.team_mode,
        'invitations': invitations_data,
        'teams': list(teams.values()),
        'can_manage': request.user.is_staff or request.user.is_superuser or tournament.created_by_id == request.user.id,
        'is_participant': is_participant
    }
    
    return Response(room_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_team(request, room_id):
    """Remove a complete pair/team. Only the tournament owner or staff may do this."""
    room = get_object_or_404(Room, pk=room_id)
    tournament = room.tournament
    if not (request.user.is_staff or request.user.is_superuser or tournament.created_by_id == request.user.id):
        return Response({"error": "Only the tournament creator or an admin can remove teams."}, status=403)

    participant_id = request.data.get("participant_id")
    invitation_id = request.data.get("invitation_id")
    if participant_id:
        participant = get_object_or_404(RoomParticipant, pk=participant_id, room=room)
        leader_id = participant.team_leader_id or participant.user_id
    elif invitation_id:
        invitation = get_object_or_404(TeamInvitation, pk=invitation_id, room=room)
        leader_id = invitation.inviter_id
    else:
        return Response({"error": "A team participant or invitation is required."}, status=400)
    participants = list(RoomParticipant.objects.filter(room=room).filter(
        Q(user_id=leader_id) | Q(team_leader_id=leader_id)
    ).select_related("user", "user__profile"))

    with transaction.atomic():
        for member in participants:
            member.delete()

        room.invitations.filter(inviter_id=leader_id, status="pending").update(status="rejected")
        if room.status == "full":
            room.status = "open"
            room.save(update_fields=["status"])

    return Response({
        "message": "Team removed from the tournament.",
        "refunded": "0.00",
        "removed_members": len(participants),
    })

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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user_tournament(request):
    """Allow a user to create a tournament after paying a creation fee"""
    profile = request.user.profile
    if not is_game_id_verified(profile):
        return Response({"error": "Game ID not verified. Please verify in profile first."}, status=400)
    
    data = request.data
    name = data.get('name')
    game = data.get('game')
    tournament_type = data.get('tournament_type', 'one_vs_one')
    entry_fee = Decimal(str(data.get('entry_fee', 0)))
    team_mode = data.get('team_mode', 'solo')
    max_participants = int(data.get('max_participants', 100))
    custom_player_count = int(data.get('custom_player_count', 0) or 0)
    start_time = data.get('start_time')
    prize_distributions = data.get('prize_distributions', []) # List of {rank: int, prize: float}

    if not name or not game:
        return Response({"error": "Name and Game are required"}, status=400)
    if not profile_game_id(profile, game):
        return Response({"error": f"Please add your {game.upper()} ID in your profile first."}, status=400)

    approved_request = None
    if tournament_type == 'br':
        approved_request, validation_error = _validate_br_tournament(
            request, team_mode, custom_player_count
        )
        if validation_error:
            return validation_error
        max_participants = custom_player_count

    # Calculate total costs
    creation_fee = Decimal("50.00") if tournament_type == "br" else Decimal("10.00")
    
    # Calculate total prize money
    total_prize_money = _prize_pool(prize_distributions)
    
    # Total amount to deduct = creation fee + prize pool
    total_deduction = creation_fee + total_prize_money
    
    # Check if creator has enough balance
    if profile.balance < total_deduction:
        return Response({
            "error": f"Insufficient balance. Required: ₹{total_deduction} (₹{creation_fee} creation fee + ₹{total_prize_money} prize pool). Your balance: ₹{profile.balance}"
        }, status=400)

    with transaction.atomic():
        # 1. Deduct creation fee + prize money
        profile.balance -= total_deduction
        profile.save()

        # 2. Record transaction for creation fee
        Transaction.objects.create(
            profile=profile,
            tx_type="debit",
            amount=creation_fee,
            note=f"Tournament Creation Fee: {name}"
        )

        # 3. Record transaction for prize pool
        if total_prize_money > 0:
            Transaction.objects.create(
                profile=profile,
                tx_type="debit",
                amount=total_prize_money,
                note=f"Tournament Prize Pool: {name}"
            )

        # 3. Create Tournament
        tournament = Tournament.objects.create(
            name=name,
            game=game,
            tournament_type=tournament_type,
            entry_fee=entry_fee,
            team_mode=team_mode,
            max_participants=max_participants,
            custom_player_count=custom_player_count if tournament_type == 'br' else 0,
            start_time=start_time or timezone.now() + timezone.timedelta(hours=1),
            created_by=request.user,
            is_active=True,
            host_partner_request=approved_request if tournament_type == 'br' else None,
        )

        # 4. Create Prize Distributions
        for dist in prize_distributions:
            PrizeDistribution.objects.create(
                tournament=tournament,
                rank=dist['rank'],
                prize_amount=Decimal(str(dist['prize']))
            )

        # 5. Create associated Room
        Room.objects.create(tournament=tournament, owner=request.user)

    return Response({
        "message": "Tournament created successfully!",
        "tournament_id": tournament.id,
        "fee_deducted": str(total_deduction),
        "breakdown": {
            "creation_fee": str(creation_fee),
            "prize_pool": str(total_prize_money)
        }
    })
