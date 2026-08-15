from rest_framework import serializers

from .models import Profile, User


class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "avatar",
            "oauth_avatar_url",
            "location",
            "bio",
            "elo_rating",
            "peak_rating",
            "total_games",
            "wins",
            "losses",
            "draws",
            "current_streak",
        ]


class PublicUserProfileSerializer(serializers.ModelSerializer):
    # Keep hover profile data separate from private user account data
    profile = PublicProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "profile",
        ]