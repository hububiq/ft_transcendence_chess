from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, 
    register_user, 
    update_elo, 
    update_my_profile, 
    upload_avatar, 
    get_my_profile
)


# The Router automatically creates all the URL paths for our ViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('register/', register_user, name='register'),
    path('update-elo/', update_elo, name='update_elo'),
    path('me/', get_my_profile, name='my_profile'),
    path('me/update/', update_my_profile, name='update_profile'),
    path('me/avatar/', upload_avatar, name='upload_avatar'),
    path('', include(router.urls)),
]