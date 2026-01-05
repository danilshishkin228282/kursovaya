from django.contrib import admin

from django.contrib import admin
from .models import Book, ReadingEntry, ReadingGoal

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'publication_year']
    list_filter = ['genre']
    search_fields = ['title', 'author']

@admin.register(ReadingEntry)
class ReadingEntryAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'status', 'rating', 'date_added']
    list_filter = ['status', 'rating']
    search_fields = ['user__username', 'book__title']

@admin.register(ReadingGoal)
class ReadingGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'year', 'target_books', 'books_read_count', 'progress_percentage']
    list_filter = ['year']