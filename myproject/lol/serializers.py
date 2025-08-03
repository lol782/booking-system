from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Museum, Booking, Visitor, Ticket

class MuseumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Museum
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'

class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    museum_name = serializers.CharField(source='museum.name', read_only=True)
    visitor_name = serializers.CharField(source='visitor.name', read_only=True)
    ticket_type = serializers.CharField(source='ticket.__str__', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'museum_name', 'visitor_name', 'ticket_type', 'visit_date']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
