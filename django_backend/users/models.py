from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_bot = models.BooleanField(default=False)
    bot_difficulty = models.IntegerField(null=True, blank=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) #foreign key, CASCADE for deleting in case of deleting mother table
    elo_rating = models.IntegerField(default=1200)
    avatar_url = models.URLField(null=True, blank=True)
    
    
    # ... other stat