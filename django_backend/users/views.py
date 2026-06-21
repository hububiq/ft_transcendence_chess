from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer

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


# Should we check is email valid? (with @)

# users/views.py

@api_view(['POST'])
def update_elo(request):
    winner_id = request.data.get('winner_id')
    loser_id = request.data.get('loser_id')
    
    if not winner_id or not loser_id:
        return Response({"error": "Please provide winner_id and loser_id"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Find their profiles in the database
        winner_profile = Profile.objects.get(user__id=winner_id)
        loser_profile = Profile.objects.get(user__id=loser_id)
        
        # Simple MVP Math (we can replace this with the real ELO curve later)
        # What about winning with player higher in ranking? Getting more points?
        winner_profile.elo_rating += 30
        winner_profile.wins += 1
        winner_profile.total_games += 1
        
        loser_profile.elo_rating -= 30
        loser_profile.losses += 1
        loser_profile.total_games += 1
        
        # Save to PostgreSQL
        winner_profile.save()
        loser_profile.save()
        
        return Response({"message": "ELO updated successfully"}, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response({"error": "One or both users not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    serializer = UserSerializer(request.user) #request.user is populated with JWT token, Django knows rightaway who is making the request.
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    profile = request.user.profile 

    profile.bio = request.data.get('bio', profile.bio)
    profile.location = request.data.get('location', profile.location)
    profile.theme_color = request.data.get('theme_color', profile.theme_color)

    profile.save()
    return Response({"message": "Profile updated successfully"}, status=status.HTTP_200_OK)

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