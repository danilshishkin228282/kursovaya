from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, ReadingEntry, ReadingGoal

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

class ReadingEntrySerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)
    
    class Meta:
        model = ReadingEntry
        fields = '__all__'
        read_only_fields = ['user', 'date_added']

class ReadingGoalSerializer(serializers.ModelSerializer):
    books_read_count = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ReadingGoal
        fields = '__all__'
        read_only_fields = ['user']