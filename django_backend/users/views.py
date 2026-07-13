from rest_framework import viewsets
from .models import User, Profile
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, ProfileSerializer
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from redis_client import publish

# This ViewSet automatically generates GET, POST, PUT, and DELETE logic
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# @api_view(['POST']) ensures they can only submit data, not read it.
# @permission_classes([AllowAny]) is CRITICAL. It overrides global JWT rule, 
# because a new user doesn't have a JWT token yet!
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    
    # Check if the email is already taken, or if passwords are blank
    if serializer.is_valid():
        serializer.save() # This triggers the create() function from serializers.py
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    
    # If the data is bad, send the exact error back to React (e.g. "Email already exists")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# users/views.py

@api_view(['POST'])
def update_elo(request):
    winner_id = request.data.get('winner_id')
    loser_id = request.data.get('loser_id')
    
    if not winner_id:
        return Response({"error": "Winner ID required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        winner_profile = Profile.objects.get(user__id=winner_id)
        if not loser_id:
            winner_profile.elo_rating += 30
            winner_profile.wins += 1
            winner_profile.total_games += 1
            winner_profile.save()
            return Response({"message": "Bot match recorded! +10 ELO."}, status=status.HTTP_200_OK)
        
        loser_profile = Profile.objects.get(user__id=loser_id)
        winner_profile.elo_rating += 30
        winner_profile.wins += 1
        winner_profile.total_games += 1
        loser_profile.elo_rating -= 30
        loser_profile.losses += 1
        loser_profile.total_games += 1
        winner_profile.save()
        loser_profile.save()

        return Response({"message": "Human ELO updated successfully"}, status=status.HTTP_200_OK)

    except Profile.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    serializer = UserSerializer(request.user) #request.user is populated with JWT token, Django knows rightaway who is making the request.
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    user = request.user
    profile = user.profile
    
    if 'email' in request.data:
        new_email = request.data['email']
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response({"error": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)
        user.email = new_email
        
    user.save()

    if 'username' in request.data:
        new_username = request.data['username']
        if User.objects.filter(username=new_username).exclude(id=profile.id).exists():
            return Response({"error": "This username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        user.username = new_username
        user.save()

    if 'bio' in request.data:
        profile.bio = request.data['bio']
        
    if 'location' in request.data:
        profile.location = request.data['location']

    if 'avatar' in request.FILES:
        profile.avatar = request.FILES['avatar']
        
    profile.save()
    
    return Response({"message": "Profile updated successfully!"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    profile = request.user.profile
    
    if 'avatar' not in request.FILES:
        return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    profile.avatar = request.FILES['avatar']
    profile.save()
    
    # Django automatically saves the file to /app/media/avatars/ and generates a new URL!
    return Response({"message": "Avatar uploaded!", "avatar_url": profile.avatar.url}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_friends(request):
    friends = request.user.friends.all()
    # Translate them into JSON (many=True because it's a list)
    serializer = UserSerializer(friends, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_friend(request, user_id):
    if request.user_id == user_id:
        return Response({"error": "You cannot add yourself as a friend."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        target_user = User.objects.get(id=user_id)
        request.user.friends.add(target_user)
        return Response({"message": f"Successfully added {target_user.username} tp friends."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request, user_id):
    try:
        target_user = User.objects.get(id=user_id)
        # Django removes them from the hidden junction table!
        request.user.friends.remove(target_user)
        return Response({"message": f"Successfully removed {target_user.username} from friends."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class GithubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = "http://localhost:3000/auth/github/callback" 
    client_class = OAuth2Client