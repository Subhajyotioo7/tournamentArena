# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    
    # Keep legacy field for compatibility
    game_id = models.CharField(max_length=50, null=True, blank=True)
    game_id_verified = models.BooleanField(default=False)
    
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
    STATUS = (("pending","Pending"),("approved","Approved"),("rejected","Rejected"),("paid","Paid"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    # Payment destination
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)

    # Razorpay payout fields (if using payout API), or admin will mark paid and provide tx id:
    payout_id = models.CharField(max_length=255, blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"WDR {self.amount} ({self.profile.user.username})"

class Deposit(models.Model):
    STATUS = (("pending","Pending"),("approved","Approved"),("rejected","Rejected"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    utr_number = models.CharField(max_length=100, help_text="Transaction ID / UTR Number")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
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

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, player_uuid=uuid.uuid4())

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance, player_uuid=uuid.uuid4())
