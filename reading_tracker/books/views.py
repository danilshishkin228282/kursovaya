from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count
from .models import Book, ReadingEntry, ReadingGoal
from .serializers import BookSerializer, ReadingEntrySerializer, ReadingGoalSerializer, UserSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class ReadingEntryViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingEntrySerializer
    
    def get_queryset(self):
        return ReadingEntry.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        total_books = ReadingEntry.objects.filter(user=user).count()
        finished_books = ReadingEntry.objects.filter(user=user, status='finished').count()
        reading_books = ReadingEntry.objects.filter(user=user, status='reading').count()
        want_to_read_books = ReadingEntry.objects.filter(user=user, status='want_to_read').count()
        
        genre_stats = ReadingEntry.objects.filter(
            user=user, 
            status='finished'
        ).values(
            'book__genre'
        ).annotate(
            count=Count('id')
        )
        
        return Response({
            'total_books': total_books,
            'finished_books': finished_books,
            'reading_books': reading_books,
            'want_to_read_books': want_to_read_books,
            'genre_stats': list(genre_stats)
        })

class ReadingGoalViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingGoalSerializer
    
    def get_queryset(self):
        return ReadingGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False, methods=['get'])
    def current_user(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)