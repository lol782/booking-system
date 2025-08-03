# How to Update the Backend URL

## When your ngrok URL changes:

1. **Update the .env file:**
   - Open `frontend/.env`
   - Change the `REACT_APP_BACKEND_URL` value to your new ngrok URL
   - Example: `REACT_APP_BACKEND_URL=https://new-url.ngrok-free.app`

2. **Restart the React development server:**
   - Stop the current server (Ctrl+C)
   - Run `npm start` again

## Environment Variables:

- **REACT_APP_BACKEND_URL**: Your Django backend URL (ngrok or localhost)
- **Fallback**: If not set, defaults to `http://localhost:8000`

## API Endpoints Structure:

All endpoints are automatically constructed using the base URL:
- Browse Museums: `{BACKEND_URL}/lol/api/browse/`
- Token: `{BACKEND_URL}/lol/api/token/`
- Login: `{BACKEND_URL}/lol/api/login/`
- My Bookings: `{BACKEND_URL}/lol/api/my_bookings/`
- Book Museum: `{BACKEND_URL}/lol/api/book_museum/{id}/`
- Cancel Booking: `{BACKEND_URL}/lol/api/cancel_booking/{id}/`

## Example .env file:

```
# For ngrok
REACT_APP_BACKEND_URL=https://54c742aad18d.ngrok-free.app

# For local development
# REACT_APP_BACKEND_URL=http://localhost:8000
```
