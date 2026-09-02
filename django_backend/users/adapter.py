from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        # 1. Let Django do its normal user creation first
        user = super().populate_user(request, sociallogin, data)
        
        # 2. THE BOUNCER: If the email is empty, generate a unique dummy email!
        if not user.email:
            # We use their unique GitHub ID to guarantee the fake email is 100% unique!
            user.email = f"{sociallogin.account.uid}@github.dummy.com"
            
        return user