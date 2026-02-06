from .models import Withdrawal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

@api_view(["POST"])
@permission_classes([IsAdminUser])
def mark_withdrawal_paid(request, withdrawal_id):
    # admin marks paid
    try:
        w = Withdrawal.objects.get(pk=withdrawal_id)
    except Withdrawal.DoesNotExist:
        return Response({"error":"Not found"}, status=404)
    w.status = "paid"
    w.payout_id = request.data.get("payout_id","manual-"+str(withdrawal_id))
    w.save()
    return Response({"message":"marked paid"})
