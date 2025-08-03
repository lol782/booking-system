from django.contrib.auth.views import LoginView
from .token_manager import get_user_token

class CustomLoginView(LoginView):
    def form_valid(self, form):
        """Called when valid form data has been POSTed"""
        # Get token before login
        token = get_user_token(
            username=form.cleaned_data['username'],
            password=form.cleaned_data['password']
        )
        
        response = super().form_valid(form)  # This performs the login
        
        # Store token in session after successful login
        if token:
            self.request.session['access_token'] = token
        
        return response
