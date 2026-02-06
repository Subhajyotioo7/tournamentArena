from rest_framework import serializers
from .models import Profile, Transaction, Withdrawal, Deposit, SiteConfiguration

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            "username", "is_staff", "is_superuser", "balance", "player_uuid",
            "bgmi_id", "freefire_id", "fifa_id", "game_id", "game_id_verified", "game_id_status", "game_id_rejection_reason",
            "kyc_status", "kyc_full_name", "kyc_id_type", "kyc_id_number", "kyc_document", "kyc_rejection_reason",
            "bank_name", "account_number", "ifsc_code", "upi_id", "payment_details_status", "payment_details_rejection_reason"
        ]

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "bgmi_id", "freefire_id", "fifa_id", 
            "kyc_full_name", "kyc_id_type", "kyc_id_number", "kyc_document",
            "bank_name", "account_number", "ifsc_code", "upi_id"
        ]

class KYCUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["kyc_full_name","kyc_id_type","kyc_id_number","kyc_document"]

class WithdrawalSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.user.username", read_only=True)
    
    class Meta:
        model = Withdrawal
        fields = "__all__"
        read_only_fields = ["status","profile","requested_at","payout_id"]

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "tx_type", "amount", "note", "created_at"]
        read_only_fields = ["id", "created_at"]

class DepositSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.user.username", read_only=True)
    class Meta:
        model = Deposit
        fields = "__all__"
        read_only_fields = ["status", "profile", "created_at"]

class SiteConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfiguration
        fields = "__all__"
