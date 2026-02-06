from django.apps import AppConfig


class WalletConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = 'wallet'
    label = 'wallet'  # Changed from wallet_app to match directory name
    
    def ready(self):
        import wallet.signals
