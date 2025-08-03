
from django.shortcuts import render, get_object_or_404, redirect
from .models import Museum, Exhibit, Ticket, Visitor, Booking
from .forms import BookingForm, UserRegistrationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .token_manager import get_user_token, refresh_token
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import get_token
from rest_framework import status
from .serializers import MuseumSerializer, BookingSerializer
from django.utils import timezone
from datetime import date
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view
from rest_framework.response import Response
# Create your views here.
# def lol_view(request):
#     lols = lol.objects.all()  # Fetch all instances of the lol model
#     return render(request, 'lol/lol.html', {'lols': lols})
#
# def lolform_view(request):
#     selected_lol = None
#     if request.method == 'POST':
#         form = LolForm(request.POST)
#         if form.is_valid():
#             selected_lol = form.cleaned_data['chai_variety']
#     else:
#         form = LolForm()
#     return render(request, 'lol/lol1.html', {'form': form, 'selected_lol': selected_lol})
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import MuseumSerializer
from rest_framework_simplejwt.tokens import RefreshToken

def generate_tokens_for_user(request, user):
    """Generate JWT tokens for user and store in session"""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    # Store both tokens in session
    request.session['access_token'] = access_token
    request.session['refresh_token'] = refresh_token
    
    return {
        'access': access_token,
        'refresh': refresh_token
    }

def browse(request):
    """View to render the browse.html template with museums data"""
    museums = Museum.objects.all()
    context = {'museums': museums}
    
    # Add tokens to context if user is authenticated
    if request.user.is_authenticated:
        # Check if tokens exist in session
        access_token = request.session.get('access_token')
        refresh_token = request.session.get('refresh_token')
        
        if access_token and refresh_token:
            # Tokens exist in session, use them
            context['access_token'] = {
                'access': access_token,
                'refresh': refresh_token
            }
        else:
            # Generate new tokens if they don't exist
            tokens = generate_tokens_for_user(request, request.user)
            context['access_token'] = tokens
    
    return render(request, 'lol/browse.html', context)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def browse_museums(request):
    museums = Museum.objects.all()
    serializer = MuseumSerializer(museums, many=True)
    return Response(serializer.data)


def museum_detail(request, museum_id):
    museum = get_object_or_404(Museum, id=museum_id)
    exhibits = museum.exhibits.all()
    return render(request, 'lol/museum_detail.html', {'museum': museum, 'exhibits': exhibits})

@login_required
def book_museum(request, museum_id):
    museum = get_object_or_404(Museum, id=museum_id)

    if request.method == "POST":
        form = BookingForm(request.POST)
        if form.is_valid():
            # Create a new visitor entry for each booking
            visitor = Visitor.objects.create(
                user=request.user,
                name=form.cleaned_data['name'],
                email=request.user.email,
                phone=form.cleaned_data['phone']
            )
            
            # Save Booking
            Booking.objects.create(
                visitor=visitor,
                ticket=form.cleaned_data['ticket'],
                museum=museum,
                visit_date=form.cleaned_data['visit_date']
            )
            return redirect('success_page')
    else:
        # Pre-fill form with user data if visitor exists
        initial_data = {}
        try:
            visitor = Visitor.objects.get(user=request.user)
            initial_data = {
                'name': visitor.name,
                'email': visitor.email,
                'phone': visitor.phone
            }
        except Visitor.DoesNotExist:
            initial_data = {
                'email': request.user.email
            }
        form = BookingForm(initial=initial_data)

    return render(request, 'lol/booking_form.html', {'form': form, 'museum': museum})

@login_required
def booking_cancel(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    if request.method == "POST":
        booking.delete()
        return redirect('browse')  # redirect to browse page
    return render(request, 'lol/cancel_booking.html', {'booking': booking})

@login_required
def success_page(request):
    return render(request, 'lol/success.html')


def register(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)  # Get the user object without saving
            user.set_password(form.cleaned_data['password1'])  # Hash the password
            user.save()  # Now save the user with the hashed password
            
            # Get token from API
            tokens = get_user_token(
                username=user.username,
                password=form.cleaned_data['password1']
            )
            if tokens:
                request.session['access_token'] = tokens['access']
                request.session['refresh_token'] = tokens['refresh']
            
            login(request, user)  # Log the user in
            return redirect('home')
    else:
        form = UserRegistrationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def mybookings(request):
    bookings = Booking.objects.filter(visitor__user=request.user)
    return render(request, 'lol/my_bookings.html', {'bookings': bookings})

# ============ NEW API ENDPOINTS FOR CHATBOT BOOKING ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_museum_api(request, museum_id):
    """
    API endpoint for chatbot to book museum tickets.
    This is separate from your existing HTML form booking.
    """
    try:
        museum = get_object_or_404(Museum, id=museum_id)
        
        # Check if user already has a booking for this museum
        existing_booking = Booking.objects.filter(
            visitor__user=request.user, 
            museum=museum
        ).first()
        
        if existing_booking:
            return Response({
                "error": "You already have a booking for this museum",
                "existing_booking_id": existing_booking.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create visitor for this user
        visitor, created = Visitor.objects.get_or_create(
            user=request.user,
            defaults={
                'name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'phone': ''  # You might want to get this from user profile
            }
        )
        
        # Get default ticket (you might want to make this configurable)
        try:
            default_ticket = Ticket.objects.first()  # Get first available ticket
            if not default_ticket:
                return Response({
                    "error": "No tickets available for booking"
                }, status=status.HTTP_400_BAD_REQUEST)
        except Ticket.DoesNotExist:
            return Response({
                "error": "No tickets available for booking"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the booking with tomorrow's date as default
        booking = Booking.objects.create(
            visitor=visitor,
            ticket=default_ticket,
            museum=museum,
            visit_date=date.today()  # You can change this logic
        )
        
        return Response({
            "message": "Booking successful!",
            "booking_id": booking.id,
            "museum_name": museum.name,
            "visit_date": booking.visit_date,
            "ticket_type": default_ticket.name if hasattr(default_ticket, 'name') else str(default_ticket)
        }, status=status.HTTP_201_CREATED)
    
    except Museum.DoesNotExist:
        return Response({
            "error": "Museum not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_bookings_api(request):
    """
    API endpoint to get user's bookings for the chatbot.
    """
    try:
        bookings = Booking.objects.filter(visitor__user=request.user)
        booking_data = []
        
        for booking in bookings:
            booking_data.append({
                "booking_id": booking.id,
                "museum_name": booking.museum.name,
                "museum_location": getattr(booking.museum, 'location', 'Location not specified'),
                "visit_date": booking.visit_date,
                "ticket_type": str(booking.ticket),
                "created_at": booking.created_at if hasattr(booking, 'created_at') else None,
            })
        
        return Response(booking_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking_api(request, booking_id):
    """
    API endpoint for chatbot to cancel bookings.
    """
    try:
        booking = get_object_or_404(
            Booking, 
            id=booking_id, 
            visitor__user=request.user
        )
        
        # Store booking info before deletion
        museum_name = booking.museum.name
        visit_date = booking.visit_date
        
        # Delete the booking
        booking.delete()
        
        return Response({
            "message": f"Booking for {museum_name} on {visit_date} has been cancelled successfully",
            "cancelled_booking_id": booking_id
        }, status=status.HTTP_200_OK)
    
    except Booking.DoesNotExist:
        return Response({
            "error": "Booking not found or you don't have permission to cancel it"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def browse_museums_api(request):
    """
    Enhanced API endpoint specifically for chatbot to browse museums.
    Returns data in the format expected by your FastAPI chatbot.
    No authentication required - public endpoint.
    """
    try:
        museums = Museum.objects.all()
        museum_data = []
        
        for museum in museums:
            museum_data.append({
                "museum_id": museum.id,
                "name": museum.name,
                "description": getattr(museum, 'description', 'No description available'),
                "location": getattr(museum, 'location', 'Location not specified'),
                # Add other fields as needed based on your Museum model
            })
        
        return Response(museum_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)