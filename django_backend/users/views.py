from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer

# This ViewSet automatically generates GET, POST, PUT, and DELETE logic
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer