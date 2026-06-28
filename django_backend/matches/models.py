from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    oauth_avatar_url = models.URLField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    theme_color = models.CharField(max_length=20, default='dark')
    is_online = models.BooleanField(default=False)

    elo_rating = models.IntegerField(default=1200)
    peak_rating = models.IntegerField(default=1200)
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)

    def __str__(self):
        return f"Profile of {self.user.username}"
