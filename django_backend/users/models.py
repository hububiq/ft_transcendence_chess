from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.account.signals import user_signed_up
from allauth.socialaccount.signals import social_account_added, social_account_updated


class User(AbstractUser):
    email = models.EmailField(unique=True)

    friends = models.ManyToManyField('self', blank=True, symmetrical=True)
    oauth_provider = models.CharField(max_length=50, null=True, blank=True)
    oauth_id = models.CharField(max_length=100, null=True, blank=True)

    is_bot = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) #foreign key, CASCADE for deleting in case of deleting mother table
    
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    oauth_avatar_url = models.URLField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True, default="Warschau")
    bio = models.TextField(default="", blank=True)
    elo_rating = models.IntegerField(default=1200)
    peak_rating = models.IntegerField(default=1200)
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Profile of {self.user.username}"

#event listener - to allow tables creation upon GitHub login - otherwise it's bypassed.
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    # 'instance' is the User just saved.
    # 'created' is a boolean. True if it's a brand new user, False if they just changed their password.
    if created:
        Profile.objects.create(user=instance)

def _populate_oauth_data(user, sociallogin):
    if not sociallogin:
        return

    user.oauth_provider = sociallogin.account.provider
    user.oauth_id = sociallogin.account.uid

    profile = getattr(user, "profile", None)
    if profile is not None:
        extra_data = getattr(sociallogin.account, "extra_data", {}) or {}
        avatar_url = (
            extra_data.get("avatar_url")
            or extra_data.get("avatar")
            or sociallogin.account.get_avatar_url()
        )
        if avatar_url:
            profile.oauth_avatar_url = avatar_url
            profile.save(update_fields=["oauth_avatar_url"])

    user.save(update_fields=["oauth_provider", "oauth_id"])


#to update ouath_provider in database
@receiver(user_signed_up)
def populate_oauth_data(request, user, **kwargs):
    # kwargs will contain 'sociallogin' if sb used GitHub
    sociallogin = kwargs.get('sociallogin')
    _populate_oauth_data(user, sociallogin)

   # if sociallogin:
   #     user.oauth_provider = sociallogin.account.provider
   #    user.oauth_id = sociallogin.account.uid
   #    user.save()

@receiver(social_account_added)
def update_oauth_profile_on_update(request, sociallogin, **kwargs):
    _populate_oauth_data(sociallogin.user, sociallogin)