from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, ReadingEntryViewSet, ReadingGoalViewSet, UserViewSet
from .auth_views import login_view, register_view, logout_view

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'reading-entries', ReadingEntryViewSet, basename='readingentry')
router.register(r'reading-goals', ReadingGoalViewSet, basename='readinggoal')
router.register(r'users', UserViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/logout/', logout_view, name='logout'),
]