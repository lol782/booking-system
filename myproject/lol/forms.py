from django import forms
from .models import Ticket
from django.contrib.auth.forms import UserCreationForm

class BookingForm(forms.Form):
    name = forms.CharField(label='Full Name', max_length=100)
    email = forms.EmailField(label='Email')
    phone = forms.CharField(label='Phone', max_length=15)
    ticket = forms.ModelChoiceField(queryset=Ticket.objects.all(), label='Ticket Type')

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(label='Email')

    class Meta:
        model = UserCreationForm.Meta.model
        fields = ('username', 'email', 'password1', 'password2')
