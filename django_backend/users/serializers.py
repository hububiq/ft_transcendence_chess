import re
from rest_framework import serializers
from .models import User, Profile
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

# 1. THE PROFILE TRANSLATOR
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'avatar',  'oauth_avatar_url', 'location', 'bio', 
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
            'id', 'username', 'email', 'is_bot', 
            'oauth_provider', 'oauth_id', 'date_joined', 'profile'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    # write_only=True ensures the password is never sent back to the browser in a response!
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password']

    def validate_username(self, value):
       if not re.match(r"^[a-zA-Z][a-zA-Z0-9_-]{3,23}$", value):
           raise serializers.ValidationError("Username must start with a letter, be 4-24 characters, and contain no invalid special characters.")
       return value

    def validate_password(self, value):
       # First, run Django's default checks (Not entirely numeric, not too common)
       try:
           validate_password(value)
       except ValidationError as e:
           raise serializers.ValidationError(list(e.messages))
       
       # Next, run Custom Regex to match Frontend UI
       # (?=.*[a-z]) = At least one lowercase
       # (?=.*[A-Z]) = At least one uppercase
       # (?=.*\d)    = At least one number
       # .{8,24}     = Between 8 and 24 characters
       if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,24}$", value):
           raise serializers.ValidationError("Password must be 8-24 characters and include a lowercase letter, an uppercase letter, and a number.")
       
       return value

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