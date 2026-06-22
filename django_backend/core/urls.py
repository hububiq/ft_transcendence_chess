"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({"message": "Django auth & profile microservice is running correctly"})

urlpatterns = [
    path('', api_root_view),
    path('admin/', admin.site.urls),

 # 1. The JWT Login Endpoints (To Milos - You use this to log users in)
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 2. Custom Users API (Points to the users folder)
    path('api/', include('users.urls')), 

    path('accounts/', include('allauth.urls')),
]

# this is basically for api routes. when user hits some endpoint, in directs particular actions from views.py