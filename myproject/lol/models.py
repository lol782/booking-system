from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# class lol(models.Model):
#     mytype=[
#         ('NI','nigger'),
#         ('CH','chmar'),
#         ('BH','bhangi'),
#     ]
#     name= models.CharField(max_length=100)
#     age= models.IntegerField()
#     img=models.ImageField(upload_to='loli/')
#     type=models.CharField(max_length=2,choices=mytype)

#     def __str__(self):
#         return self.name

class Museum(models.Model):
    name = models.CharField(max_length=100)
    img = models.ImageField(upload_to='images/', null=True, blank=True)
    location = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Exhibit(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    museum = models.ForeignKey(Museum, on_delete=models.CASCADE, related_name='exhibits')

    def __str__(self):
        return self.name


class Ticket(models.Model):
    price = models.DecimalField(max_digits=8, decimal_places=2)
    issue_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket {self.id} - {self.price}"


class Visitor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)

    def __str__(self):
        return self.name


from django.utils import timezone

class Booking(models.Model):
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='bookings')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    museum = models.ForeignKey(Museum, on_delete=models.CASCADE)
    visit_date = models.DateField(default=timezone.now)  # Date when the visitor plans to visit
    booking_date = models.DateTimeField(auto_now_add=True)  # Date when the booking was made

    class Meta:
        ordering = ['visit_date', 'booking_date']  # Order by visit date, then booking date

    def __str__(self):
        return f"Booking {self.id} by {self.visitor.name} for {self.visit_date}"



