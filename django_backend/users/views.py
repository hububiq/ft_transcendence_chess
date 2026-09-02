from rest_framework import viewsets
from .models import User, Profile
from .serializers import UserSerializer
from .public_profile_serializers import PublicUserProfileSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, ProfileSerializer
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from .friendship_events import publish_friendship_change
from .user_identity_events import publish_user_identity_change
import re 

def _is_allowed_avatar(file_obj):
    """Validate that the uploaded file is a JPG or PNG image."""
    file_name = (getattr(file_obj, "name", "") or "").lower()
    content_type = (getattr(file_obj, "content_type", "") or "").lower()

    allowed_extensions = (".jpg", ".jpeg", ".png")
    allowed_content_types = ("image/jpeg", "image/png")

    return file_name.endswith(allowed_extensions) and content_type in allowed_content_types

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


@api_view(['POST'])
def update_elo(request):
    winner_id = request.data.get('winner_id')
    loser_id = request.data.get('loser_id')
    is_draw = request.data.get('is_draw', False)
    player_ids = request.data.get('player_ids', [])

    print(f"DEBUG: FastAPI sent winner_id={winner_id}, loser_id={loser_id}")

    if is_draw:
        if (
            not isinstance(player_ids, list)
            or not player_ids
            or any(
                type(player_id) is not int
                or player_id <= 0
                for player_id in player_ids
            )
        ):
            return Response(
                {"error": "Provide valid player IDs for a draw"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unique_player_ids = list(
            dict.fromkeys(player_ids)
        )

        profiles = list(
            Profile.objects.filter(
                user__id__in=unique_player_ids
            )
        )

        if len(profiles) != len(unique_player_ids):
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Draws count as completed games without changing the existing ELO rules
        for profile in profiles:
            profile.draws += 1
            profile.total_games += 1
            profile.save(
                update_fields=[
                    "draws",
                    "total_games",
                ]
            )

        return Response(
            {"message": "Draw statistics updated!"},
            status=status.HTTP_200_OK,
        )
    
    if winner_id is None and loser_id is None:
        return Response({"error": "Provide at least one ID"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # HUMAN BEAT THE BOT (loser is null)
        if winner_id and not loser_id:
            winner_profile = Profile.objects.get(user__id=winner_id)
            winner_profile.elo_rating += 10  # Flat reward for beating AI
            winner_profile.wins += 1
            winner_profile.total_games += 1
            winner_profile.current_streak += 1
            if winner_profile.elo_rating > winner_profile.peak_rating:
                winner_profile.peak_rating = winner_profile.elo_rating
            winner_profile.save()
            return Response({"message": "Bot match won! +10 ELO."}, status=status.HTTP_200_OK)

        # HUMAN LOST TO THE BOT (winner is null)
        if loser_id and not winner_id:
            loser_profile = Profile.objects.get(user__id=loser_id)
            loser_profile.elo_rating -= 10  # Flat penalty for losing to AI
            loser_profile.losses += 1
            loser_profile.total_games += 1
            loser_profile.current_streak = 0
            loser_profile.save()
            return Response({"message": "Bot match lost! -10 ELO."}, status=status.HTTP_200_OK)

        # HUMAN VS HUMAN (Both IDs exist)
        winner_profile = Profile.objects.get(user__id=winner_id)
        loser_profile = Profile.objects.get(user__id=loser_id)
        
        winner_profile.elo_rating += 30
        winner_profile.wins += 1
        winner_profile.total_games += 1
        winner_profile.current_streak += 1
        if winner_profile.elo_rating > winner_profile.peak_rating:
            winner_profile.peak_rating = winner_profile.elo_rating
        
        loser_profile.elo_rating -= 30
        loser_profile.losses += 1
        loser_profile.total_games += 1
        loser_profile.current_streak = 0
        
        winner_profile.save()
        loser_profile.save()
        
        return Response({"message": "Human vs Human ELO updated!"}, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    serializer = UserSerializer(request.user) #request.user is populated with JWT token, Django knows rightaway who is making the request.
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_public_user_profile(request, user_id):
    try:
        target_user = User.objects.select_related("profile").get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Return only fields intended for other authenticated users
    serializer = PublicUserProfileSerializer(
        target_user,
        context={"request": request},
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK,
    )

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    user = request.user
    profile = user.profile
    
    if 'email' in request.data:
        new_email = request.data['email'].strip()

        # Validation 1: Format (Must be a real email address structure)
        try:
            validate_email(new_email)
        except ValidationError:
            return Response({"error": "Please provide a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        # Validation 2: Uniqueness
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response({"error": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)
        user.email = new_email
        user.save()

    if 'username' in request.data:
        new_username = request.data['username'].strip() # Remove accidental spaces
        # Validation 1: Regex :
        # ^[a-zA-Z]        = MUST start with a letter
        # [a-zA-Z0-9_-]    = Followed by letters, numbers, underscores, or hyphens
        # {3,23}$          = For 3 to 23 more characters (making it 4 to 24 total)
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_-]{3,23}$", new_username):
            return Response(
                {"error": "Username must start with a letter, be 4-24 characters, and contain only letters, numbers, _, or -."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response({"error": "This username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        username_changed = new_username != user.username
        user.username = new_username
        user.save()

        if username_changed:
            publish_user_identity_change(user)

    if 'bio' in request.data:
        new_bio = request.data['bio'].strip()
        if len(new_bio) > 100:
            return Response({"error": "Bio cannot exceed 500 characters."}, status=status.HTTP_400_BAD_REQUEST)
        profile.bio = new_bio
        
    if 'location' in request.data:
        new_location = request.data['location'].strip()
        if len(new_location) > 30:
            return Response({"error": "Location cannot exceed 30 characters."}, status=status.HTTP_400_BAD_REQUEST)
        profile.location = new_location

    if 'avatar' in request.FILES:
        if not _is_allowed_avatar(request.FILES['avatar']):
            return Response(
                {"error": "Avatar must be a JPG or PNG file."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile.avatar = request.FILES['avatar']
        
    profile.save()
    
    return Response({"message": "Profile updated successfully!"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    profile = request.user.profile
    
    if 'avatar' not in request.FILES:
        return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not _is_allowed_avatar(request.FILES['avatar']):
        return Response(
            {"error": "Avatar must be a JPG or PNG file."},
            status=status.HTTP_400_BAD_REQUEST,
        )
        
    profile.avatar = request.FILES['avatar']
    profile.save()
    
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)

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
    if request.user.id == user_id:
        return Response({"error": "You cannot add yourself as a friend."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        target_user = User.objects.get(id=user_id)
        request.user.friends.add(target_user)
        publish_friendship_change([request.user.id, target_user.id])
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
        publish_friendship_change([request.user.id, target_user.id])
        return Response({"message": f"Successfully removed {target_user.username} from friends."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class GithubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = f"{settings.FRONTEND_URL}/auth/github/callback"
    client_class = OAuth2Client    