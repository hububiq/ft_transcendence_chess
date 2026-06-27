from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, register_user, update_elo, 
    update_my_profile, upload_avatar, get_my_profile,
    list_friends, add_friend, remove_friend,
    GithubLogin 
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
    
    # --- FRIENDS APIs ---
    path('friends/', list_friends, name='list_friends'),
    path('friends/add/<int:user_id>/', add_friend, name='add_friend'),
    path('friends/remove/<int:user_id>/', remove_friend, name='remove_friend'),
    path('', include(router.urls)),

    path('github/login/', GithubLogin.as_view(), name='github_login'),
]