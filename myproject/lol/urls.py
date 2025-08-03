from django.urls import path
from django.contrib.auth import views as auth_views
from . import views, api_views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', api_views.register_user, name='register_api'),
    path('api/login/', api_views.login_user, name='login_api'),
     # NEW API endpoints for chatbot
    path('api/browse/', views.browse_museums_api, name='browse_museums_api'),
    path('api/book_museum/<int:museum_id>/', views.book_museum_api, name='book_museum_api'),
    path('api/my_bookings/', views.user_bookings_api, name='user_bookings_api'),
    path('api/cancel_booking/<int:booking_id>/', views.cancel_booking_api, name='cancel_booking_api'),
    # path('', views.lol_view, name='lol'), # Add the lol view URL
    # path('lolform/', views.lolform_view, name='lol_form'),  # Add a URL for the lol form view
    path('book_museum/<int:museum_id>/', views.book_museum, name='book_museum'),  # URL for booking a museum
    path('browse/', views.browse, name='browse'),  # URL for browsing museums (renders HTML template)
    path('museum/<int:museum_id>/', views.museum_detail, name='museum_detail'),
    path('success/', views.success_page, name='success_page'),
    path('register/', views.register, name='register'),  # URL for user registration
    path('mybookings/', views.mybookings, name='mybookings'),
]
