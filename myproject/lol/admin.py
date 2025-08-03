from django.contrib import admin
from .models import Museum, Exhibit, Ticket, Visitor, Booking

admin.site.register(Museum)
admin.site.register(Exhibit)
admin.site.register(Ticket)
admin.site.register(Visitor)
admin.site.register(Booking)
