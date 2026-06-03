from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)

    oauth_provider = models.CharField(max_length=50, null=True, blank=True)
    oauth_id = models.CharField(max_length=100, null=True, blank=True)

    is_bot = models.BooleanField(default=False)
    bot_difficulty = models.IntegerField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) #foreign key, CASCADE for deleting in case of deleting mother table
    
    avatar_url = models.URLField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    theme_color = models.CharField(max_length=20, default='dark')
    
    elo_rating = models.IntegerField(default=1200)
    peak_rating = models.IntegerField(default=1200)
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Profile of {self.user.username}"