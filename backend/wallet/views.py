# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import Profile, Transaction, Withdrawal, Deposit, SiteConfiguration
from .serializers import (
    ProfileSerializer, ProfileUpdateSerializer, WithdrawalSerializer, 
    DepositSerializer, SiteConfigurationSerializer
)
from decimal import Decimal

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
        # Generate a player_uuid if not present
        import uuid
        if not profile.player_uuid:
            profile.player_uuid = uuid.uuid4()
            profile.save()
            
    return Response(ProfileSerializer(profile).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_balance(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
    return Response({"balance": float(profile.balance or 0)})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    profile = request.user.profile
    transactions = profile.transactions.all().order_by('-created_at')
    from .serializers import TransactionSerializer
    return Response({"transactions": TransactionSerializer(transactions, many=True).data})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    profile = request.user.profile
    data = request.data
    
    # Check for duplicate mobile number
    if 'mobile_number' in data and data['mobile_number']:
        existing_mobile = Profile.objects.filter(
            mobile_number=data['mobile_number']
        ).exclude(user=request.user).first()
        
        if existing_mobile:
            return Response({
                "error": "Mobile number already exists. This number is already registered with another account."
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for duplicate game IDs
    game_id_fields = {
        'bgmi_id': 'BGMI ID',
        'freefire_id': 'Free Fire ID',
        'fifa_id': 'FIFA ID'
    }
    
    for field_name, display_name in game_id_fields.items():
        if field_name in data and data[field_name]:
            field_value = data[field_name].strip()
            if field_value:  # Only check if not empty
                existing = Profile.objects.filter(**{field_name: field_value}).exclude(user=request.user).first()
                if existing:
                    return Response({
                        "error": f"{display_name} already exists. This {display_name} is already registered with another account."
                    }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        # Reset statuses for updated sections
        if any(k in data for k in ["bgmi_id", "freefire_id", "fifa_id"]):
            profile.game_id_status = "pending"
            for gid in [profile.bgmi_id, profile.freefire_id, profile.fifa_id]:
                if gid:
                    profile.game_id = gid
                    break
        
        if any(k in data for k in ["kyc_full_name", "kyc_id_number", "kyc_document"]):
            profile.kyc_status = "pending"
            
        if any(k in data for k in ["bank_name", "account_number", "upi_id"]):
            profile.payment_details_status = "pending"

        profile.save()
        return Response({"message": "Profile updated, awaiting admin verification"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_pending_verifications(request):
    from django.db.models import Q
    qs = Profile.objects.filter(
        Q(kyc_status="pending") | 
        Q(game_id_status="pending") | 
        Q(payment_details_status="pending")
    )
    data = ProfileSerializer(qs, many=True).data
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def verify_profile_section(request, player_uuid):
    section = request.data.get("section") # kyc, game_id, payment
    action = request.data.get("action") # approve, reject
    reason = request.data.get("reason", "")
    
    try:
        prof = Profile.objects.get(player_uuid=player_uuid)
    except Profile.DoesNotExist:
        return Response({"error":"Profile not found"}, status=404)
        
    status_val = "approved" if action == "approve" else "rejected"
    
    if section == "kyc":
        prof.kyc_status = status_val
        prof.kyc_rejection_reason = reason if action == "reject" else None
    elif section == "game_id":
        prof.game_id_status = status_val
        prof.game_id_verified = (action == "approve")
        prof.game_id_rejection_reason = reason if action == "reject" else None
    elif section == "payment":
        prof.payment_details_status = status_val
        prof.payment_details_rejection_reason = reason if action == "reject" else None
    else:
        return Response({"error": "Invalid section"}, status=400)
        
    prof.save()
    return Response({"message": f"{section.upper()} {status_val}"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    profile = request.user.profile
    amount = Decimal(request.data.get("amount","0"))
    upi_id = request.data.get("upi_id", "")
    bank_details = request.data.get("bank_details", "")
    
    if amount <= 0:
        return Response({"error":"Invalid amount"}, status=400)
    # check if user has enough balance (optional but good)
    if amount > profile.balance:
        return Response({"error":"Insufficient balance"}, status=400)

    # create withdrawal request
    w = Withdrawal.objects.create(
        profile=profile, 
        amount=amount,
        upi_id=upi_id,
        bank_details=bank_details
    )
    
    return Response({"message":"Withdrawal requested. Funds will be deducted once approved.", "withdrawal_id":str(w.id)})

@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_withdrawal(request, withdrawal_id):
    from django.db import transaction
    try:
        wd = Withdrawal.objects.get(id=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error": "Withdrawal not found"}, status=404)

    if wd.status != 'pending':
        return Response({"error": "Withdrawal is already " + wd.status}, status=400)

    with transaction.atomic():
        profile = wd.profile
        if profile.balance < wd.amount:
            return Response({"error": f"Insufficient balance. User only has ₹{profile.balance}"}, status=400)
            
        # Deduct money now
        profile.balance -= wd.amount
        profile.save()

        # Create transaction record
        Transaction.objects.create(
            profile=profile,
            tx_type="debit",
            amount=wd.amount,
            note=f"Withdrawal Approved: ID {wd.id}"
        )

        wd.status = "approved"
        wd.save()

    return Response({"message": f"Withdrawal approved and ₹{wd.amount} deducted from {profile.user.username}'s wallet."})

@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_withdrawal(request, withdrawal_id):
    try:
        wd = Withdrawal.objects.get(id=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error": "Withdrawal not found"}, status=404)

    if wd.status != 'pending':
        return Response({"error": "Withdrawal is already " + wd.status}, status=400)

    # Note: No refund needed because money is only deducted on approval now
    wd.status = "rejected"
    wd.admin_note = request.data.get("admin_note", "")
    wd.save()
    return Response({"message": "Withdrawal rejected. No funds were deducted."})

@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_withdrawals(request):
    withdrawals = Withdrawal.objects.all().order_by('-requested_at')
    from .serializers import WithdrawalSerializer
    return Response(WithdrawalSerializer(withdrawals, many=True).data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def mark_withdrawal_paid(request, withdrawal_id):
    from .models import Withdrawal

    try:
        wd = Withdrawal.objects.get(id=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error": "Withdrawal not found"}, status=404)

    wd.status = "paid"
    wd.payout_id = request.data.get("payout_id", "manual-payment")
    wd.save()

    return Response({"message": "Withdrawal marked as paid"})

@api_view(["POST"])
@permission_classes([IsAdminUser])
def verify_game_id(request, profile_id):
    try:
        profile = Profile.objects.get(id=profile_id)
        profile.game_id_verified = True
        profile.save()
        return Response({"message": "Game ID verified"}, status=200)
    except Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_withdrawals(request):
    """List withdrawals for the current user"""
    profile = request.user.profile
    withdrawals = profile.withdrawals.all().order_by('-requested_at')
    from .serializers import WithdrawalSerializer
    return Response(WithdrawalSerializer(withdrawals, many=True).data)

# --- 💳 MANUAL DEPOSIT & SITE CONFIG VIEWS ---

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_site_config(request):
    """Get UPI ID and WhatsApp for manual payments"""
    config = SiteConfiguration.objects.first()
    if not config:
        # Create default if none exists
        config = SiteConfiguration.objects.create()
    return Response(SiteConfigurationSerializer(config).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_deposit(request):
    """User submits a deposit request after manual transfer"""
    profile = request.user.profile
    amount = Decimal(request.data.get("amount", "0"))
    utr = request.data.get("utr_number", "").strip()

    if amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)
    if not utr:
        return Response({"error": "UTR number is required"}, status=400)

    # Check if UTR already exists to prevent duplicate claims
    if Deposit.objects.filter(utr_number=utr).exists():
        return Response({"error": "This transaction ID has already been submitted."}, status=400)

    deposit = Deposit.objects.create(
        profile=profile,
        amount=amount,
        utr_number=utr,
        status="pending"
    )

    return Response({
        "message": "Deposit request submitted! We will verify your transaction shortly.",
        "id": deposit.id
    })

@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_pending_deposits(request):
    """Admin lists all pending deposit claims"""
    deposits = Deposit.objects.filter(status="pending").order_by('-created_at')
    return Response(DepositSerializer(deposits, many=True).data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def verify_deposit(request, deposit_id):
    """Admin approves or rejects a deposit"""
    from django.db import transaction
    action = request.data.get("action") # approve, reject
    admin_note = request.data.get("admin_note", "")

    try:
        dep = Deposit.objects.get(id=deposit_id)
    except Deposit.DoesNotExist:
        return Response({"error": "Deposit not found"}, status=404)

    if dep.status != "pending":
        return Response({"error": "Request already processed"}, status=400)

    if action == "approve":
        with transaction.atomic():
            dep.status = "approved"
            dep.admin_note = admin_note
            dep.save()

            # Credit User Wallet
            profile = dep.profile
            profile.balance += dep.amount
            profile.save()

            # Record Transaction
            Transaction.objects.create(
                profile=profile,
                tx_type="credit",
                amount=dep.amount,
                note=f"Deposit Approved | UTR: {dep.utr_number}"
            )
        return Response({"message": f"Approved! ₹{dep.amount} credited to {profile.user.username}"})

    elif action == "reject":
        dep.status = "rejected"
        dep.admin_note = admin_note
        dep.save()
        return Response({"message": "Deposit request rejected"})

    return Response({"error": "Invalid action"}, status=400)
