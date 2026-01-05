from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Book(models.Model):
    GENRE_CHOICES = [
        ('fiction', 'Художественная литература'),
        ('non_fiction', 'Нехудожественная литература'),
        ('fantasy', 'Фэнтези'),
        ('sci_fi', 'Научная фантастика'),
        ('mystery', 'Детектив'),
        ('romance', 'Роман'),
        ('biography', 'Биография'),
        ('history', 'История'),
        ('science', 'Наука'),
        ('other', 'Другое'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Название")
    author = models.CharField(max_length=200, verbose_name="Автор")
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES, verbose_name="Жанр")
    publication_year = models.IntegerField(null=True, blank=True, verbose_name="Год издания")
    description = models.TextField(blank=True, verbose_name="Описание")
    cover = models.ImageField(upload_to='book_covers/', null=True, blank=True, verbose_name="Обложка")
    
    def __str__(self):
        return f"{self.title} - {self.author}"

class ReadingEntry(models.Model):
    STATUS_CHOICES = [
        ('want_to_read', 'Хочу прочитать'),
        ('reading', 'Читаю'),
        ('finished', 'Прочитано'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name="Книга")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='want_to_read', verbose_name="Статус")
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)], verbose_name="Оценка")
    review = models.TextField(blank=True, verbose_name="Отзыв")
    date_added = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    date_started = models.DateField(null=True, blank=True, verbose_name="Дата начала чтения")
    date_finished = models.DateField(null=True, blank=True, verbose_name="Дата окончания чтения")
    
    class Meta:
        unique_together = ['user', 'book']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} ({self.status})"

class ReadingGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    year = models.IntegerField(default=timezone.now().year, verbose_name="Год")
    target_books = models.IntegerField(default=12, verbose_name="Цель по книгам")
    
    class Meta:
        unique_together = ['user', 'year']
    
    def __str__(self):
        return f"{self.user.username} - {self.year}: {self.target_books} книг"
    
    def books_read_count(self):
        return ReadingEntry.objects.filter(
            user=self.user, 
            status='finished',
            date_finished__year=self.year
        ).count()
    
    def progress_percentage(self):
        if self.target_books == 0:
            return 0
        return min(100, int((self.books_read_count() / self.target_books) * 100))