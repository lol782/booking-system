import requests

def get_user_token(username, password):
    """Get JWT token for user from API"""
    try:
        # Your FastAPI endpoint for getting token
        response = requests.post('https://54c742aad18d.ngrok-free.app/lol/api/token/', {
            'username': username,
            'password': password
        })
        
        if response.ok:
            data = response.json()
            access = data.get('access')
            refresh = data.get('refresh')
            
            if access and refresh:
                return {
                    'access': access,
                    'refresh': refresh
                }
            print("Warning: Received incomplete token data:", data)
        return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

def refresh_token(refresh_token):
    """Refresh an expired access token"""
    try:
        response = requests.post('https://54c742aad18d.ngrok-free.app/lol/api/token/refresh/', {
            'refresh': refresh_token
        })
        
        if response.ok:
            data = response.json()
            return {
                'access': data.get('access'),
                'refresh': data.get('refresh', refresh_token)  # Use old refresh token if new one not provided
            }
        return None
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return None
