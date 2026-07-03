from rest_framework import serializers
from .models import User, Profile

# 1. THE PROFILE TRANSLATOR
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'avatar',  'oauth_avatar_url', 'location', 'bio', 'theme_color', 
            'elo_rating', 'peak_rating', 'total_games', 
            'wins', 'losses', 'draws', 'current_streak'
        ]
# 2. THE USER TRANSLATOR
class UserSerializer(serializers.ModelSerializer):
    # (Nesting)
    # Instead of just sending the profile's ID number, we tell Django to grab 
    # the entire ProfileSerializer and stuff it inside the User JSON!
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        # We only send safe data, not include 'password' here
        # If we did, we would be sending hashed passwords to the React frontend.
        fields = [
            'id', 'username', 'email', 'is_bot', 'bot_difficulty', 
            'oauth_provider', 'date_joined', 'profile'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    # write_only=True ensures the password is never sent back to the browser in a response!
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password']

    def create(self, validated_data):
        # 1. Create the User. 
        # We MUST use create_user() here instead of normal save() because 
        # create_user() automatically hashes the password
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        
        return user