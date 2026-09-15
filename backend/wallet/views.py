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
from decimal import Decimal, InvalidOperation
import requests
from django.db import transaction
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl
from django.conf import settings
from django.http import HttpResponseRedirect
from django.views.decorators.http import require_GET
from django.utils import timezone
from .payouts import calculate_payout_breakdown, send_phonepe_payout

INVALID_AMOUNT_ERROR = "Invalid amount"
WITHDRAWAL_NOT_FOUND_ERROR = "Withdrawal not found"


@require_GET
def add_money_redirect(request):
    """Forward PhonePe callbacks from the backend to the React wallet page."""
    target = f"{settings.FRONTEND_URL.rstrip('/')}/wallet/add-money"
    parts = urlsplit(target)
    query = dict(parse_qsl(parts.query))
    query.update(request.GET.dict())
    return HttpResponseRedirect(
        urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    )

def _reserve_instant_withdrawal(profile, withdrawal, total_debit, payout_amount, gateway_fee, gst_amount):
    with transaction.atomic():
        locked_profile = Profile.objects.select_for_update().get(pk=profile.pk)
        if locked_profile.balance < total_debit:
            withdrawal.status = "failed"
            withdrawal.admin_note = "Insufficient balance."
            withdrawal.save(update_fields=["status", "admin_note"])
            return None, locked_profile.balance
        locked_profile.balance -= total_debit
        locked_profile.save(update_fields=["balance"])
        debit_transaction = Transaction.objects.create(
            profile=locked_profile,
            tx_type="debit",
            amount=total_debit,
            note=f"Instant UPI withdrawal {withdrawal.id} "
                 f"(payout ₹{payout_amount}, fee ₹{gateway_fee}, GST ₹{gst_amount})",
        )
    return debit_transaction, locked_profile.balance


def _refund_instant_withdrawal(profile, withdrawal, total_debit):
    with transaction.atomic():
        locked_profile = Profile.objects.select_for_update().get(pk=profile.pk)
        locked_profile.balance += total_debit
        locked_profile.save(update_fields=["balance"])
        Transaction.objects.create(
            profile=locked_profile,
            tx_type="credit",
            amount=total_debit,
            note=f"Refund for failed instant withdrawal {withdrawal.id}",
        )


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

    selected_game = data.get("selected_game", profile.selected_game)
    selected_game_field = {"bgmi": "bgmi_id", "freefire": "freefire_id", "fifa": "fifa_id"}.get(selected_game)
    if selected_game_field and not data.get(selected_game_field, getattr(profile, selected_game_field, None)):
        return Response({
            "error": f"Enter your {game_id_fields[selected_game_field]} before selecting this game."
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
            profile.game_id_verified = False
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
    import uuid
    qs = Profile.objects.filter(
        Q(kyc_status="pending") | 
        Q(game_id_status="pending") | 
        Q(payment_details_status="pending")
    )
    # Older profiles may predate player_uuid. Populate it before sending
    # verification actions to the admin UI.
    for profile in qs:
        if not profile.player_uuid:
            profile.player_uuid = uuid.uuid4()
            profile.save(update_fields=["player_uuid"])
    data = ProfileSerializer(qs, many=True).data
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def verify_profile_section(request, player_uuid):
    section = request.data.get("section") # kyc, game_id, payment
    action = request.data.get("action") # approve, reject
    reason = request.data.get("reason", "")
    
    if not player_uuid:
        return Response({"error": "A valid profile verification ID is required"}, status=400)

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
    funds_reserved = False
    try:
        amount = Decimal(str(request.data.get("amount", "0"))).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": INVALID_AMOUNT_ERROR}, status=400)
    upi_id = str(request.data.get("upi_id", "")).strip()
    payout_method = request.data.get("payout_method", "manual")
    
    if amount <= 0:
        return Response({"error": INVALID_AMOUNT_ERROR}, status=400)
    if payout_method not in ("instant", "manual"):
        return Response({"error": "Invalid payout method"}, status=400)
    if not upi_id:
        return Response({"error": "UPI ID is required"}, status=400)
    w = Withdrawal.objects.create(
        profile=profile, amount=amount, upi_id=upi_id, payout_method=payout_method
    )
    if payout_method == "manual":
        return Response({"message": "Withdrawal sent to admin for manual payout.", "withdrawal_id": str(w.id)})

    try:
        payout_amount, gateway_fee, gst_amount = calculate_payout_breakdown(amount)
        total_debit = (payout_amount + gateway_fee + gst_amount).quantize(Decimal("0.01"))
        debit_transaction, wallet_balance = _reserve_instant_withdrawal(
            profile, w, total_debit, payout_amount, gateway_fee, gst_amount
        )
        if debit_transaction is None:
            return Response({
                "error": (
                    f"Insufficient balance. You need ₹{total_debit:.2f}, "
                    f"but your wallet has ₹{wallet_balance:.2f}."
                ),
                "required_amount": str(total_debit),
                "wallet_balance": str(wallet_balance),
            }, status=400)
        funds_reserved = True
        w.payout_amount = payout_amount
        w.gateway_fee = gateway_fee
        w.gst_amount = gst_amount
        w.status = "processing"
        w.save(update_fields=["payout_amount", "gateway_fee", "gst_amount", "status"])
        payout_id = send_phonepe_payout(
            amount=payout_amount,
            upi_id=upi_id,
            merchant_user_id=str(request.user.id),
            merchant_order_id=f"WDR{w.id.hex.upper()}",
        )
        w.status = "paid"
        w.payout_id = payout_id
        w.payout_transaction_id = str(debit_transaction.id)
        w.paid_at = timezone.now()
        w.save(update_fields=["status", "payout_id", "payout_transaction_id", "paid_at"])
        return Response({
            "message": "Instant UPI payout completed.",
            "withdrawal_id": str(w.id),
            "payout_amount": str(payout_amount),
            "gateway_fee": str(gateway_fee),
            "gst_amount": str(gst_amount),
            "total_debit": str(total_debit),
            "payout_id": payout_id,
        })
    except (RuntimeError, ValueError, requests.RequestException) as exc:
        if funds_reserved:
            _refund_instant_withdrawal(profile, w, total_debit)
        w.status = "failed"
        w.admin_note = str(exc)[:500]
        w.save(update_fields=["status", "admin_note"])
        error_text = str(exc)
        response_status = 400 if error_text.startswith("PhonePe Payouts is not configured") else 502
        return Response({"error": f"Instant payout failed: {error_text}"}, status=response_status)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def withdrawal_pricing(request):
    try:
        amount = Decimal(str(request.query_params.get("amount", "0"))).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": INVALID_AMOUNT_ERROR}, status=400)
    if amount <= 0:
        return Response({"error": "Enter an amount to calculate fees"}, status=400)
    payout_amount, fee, gst = calculate_payout_breakdown(amount)
    total_debit = (payout_amount + fee + gst).quantize(Decimal("0.01"))
    return Response({
        "gateway_fee": fee,
        "gst_amount": gst,
        "gst_rate": settings.PHONEPE_PAYOUT_GST_RATE,
        "payout_amount": payout_amount,
        "total_debit": total_debit,
    })

@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_withdrawal(request, withdrawal_id):
    from django.db import transaction
    try:
        wd = Withdrawal.objects.get(id=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error": WITHDRAWAL_NOT_FOUND_ERROR}, status=404)

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
        tx = Transaction.objects.create(
            profile=profile,
            tx_type="debit",
            amount=wd.amount,
            note=f"Withdrawal Approved: ID {wd.id}"
        )

        wd.status = "approved"
        wd.payout_amount = wd.amount
        wd.payout_transaction_id = str(tx.id)
        wd.save(update_fields=["status", "payout_amount", "payout_transaction_id"])

    return Response({"message": f"Withdrawal approved and ₹{wd.amount} deducted from {profile.user.username}'s wallet."})

@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_withdrawal(request, withdrawal_id):
    try:
        wd = Withdrawal.objects.get(id=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error": WITHDRAWAL_NOT_FOUND_ERROR}, status=404)

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
        return Response({"error": WITHDRAWAL_NOT_FOUND_ERROR}, status=404)

    wd.status = "paid"
    wd.payout_id = request.data.get("payout_id", "manual-payment")
    wd.paid_at = timezone.now()
    wd.save(update_fields=["status", "payout_id", "paid_at"])

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
        return Response({"error": INVALID_AMOUNT_ERROR}, status=400)
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
