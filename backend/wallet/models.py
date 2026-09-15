# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Unique UUID for tournaments
    player_uuid = models.UUIDField(editable=False, unique=True, null=True)

    # Wallet
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Game ID fields
    bgmi_id = models.CharField(max_length=50, null=True, blank=True)
    freefire_id = models.CharField(max_length=50, null=True, blank=True)
    fifa_id = models.CharField(max_length=50, null=True, blank=True)
    selected_game = models.CharField(
        max_length=20,
        choices=(("bgmi", "BGMI"), ("freefire", "Free Fire"), ("fifa", "FIFA")),
        null=True,
        blank=True,
    )
    
    # Keep legacy field for compatibility
    game_id = models.CharField(max_length=50, null=True, blank=True)
    game_id_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    
    VERIFICATION_STATUS = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected")
    )
    game_id_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default="pending")
    game_id_rejection_reason = models.TextField(null=True, blank=True)

    # KYC fields
    kyc_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default="pending")
    kyc_full_name = models.CharField(max_length=255, null=True, blank=True)
    kyc_id_type = models.CharField(max_length=50, null=True, blank=True)
    kyc_id_number = models.CharField(max_length=128, null=True, blank=True)
    kyc_document = models.FileField(upload_to="kyc_docs/", null=True, blank=True)
    kyc_rejection_reason = models.TextField(null=True, blank=True)
    
    # Mobile Number for KYC
    mobile_number = models.CharField(max_length=15, null=True, blank=True)

    # Bank Details / UPI
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    account_number = models.CharField(max_length=50, null=True, blank=True)
    ifsc_code = models.CharField(max_length=20, null=True, blank=True)
    upi_id = models.CharField(max_length=100, null=True, blank=True)
    
    payment_details_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default="pending")
    payment_details_rejection_reason = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} profile"

class Transaction(models.Model):
    TX_TYPES = (("credit","Credit"),("debit","Debit"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="transactions")
    tx_type = models.CharField(max_length=10, choices=TX_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tx_type} {self.amount} ({self.profile.user.username})"

class Withdrawal(models.Model):
    STATUS_CHOICES = (("pending","Pending"),("processing","Processing"),("approved","Approved"),("rejected","Rejected"),("paid","Paid"),("failed","Failed"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gateway_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    # Payment destination
    upi_id = models.CharField(max_length=100, blank=True, null=True)

    # External payout fields, or admin can mark a manual payout as paid.
    payout_id = models.CharField(max_length=255, blank=True, null=True)
    payout_method = models.CharField(max_length=20, choices=(("instant", "Instant UPI"), ("manual", "Manual")), default="manual")
    payout_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    admin_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"WDR {self.amount} ({self.profile.user.username})"

class Deposit(models.Model):
    STATUS_CHOICES = (("pending","Pending"),("approved","Approved"),("rejected","Rejected"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    utr_number = models.CharField(max_length=100, help_text="Transaction ID / UTR Number")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"DEP {self.amount} ({self.profile.user.username})"

class SiteConfiguration(models.Model):
    upi_id = models.CharField(max_length=255, default="example@upi")
    whatsapp_number = models.CharField(max_length=20, default="+910000000000")
    qr_code = models.ImageField(upload_to="site_config/", null=True, blank=True)

    class Meta:
        verbose_name = "Site Configuration"
        verbose_name_plural = "Site Configuration"

    def __str__(self):
        return "Site Global Settings"

class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_verification")
    game_id = models.CharField(max_length=50, null=True, blank=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
