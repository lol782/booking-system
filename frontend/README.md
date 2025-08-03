# Museum Booking Frontend

A React frontend application for the Museum Booking Django backend.

## Features

- User authentication (login/register)
- Browse museums
- Book museum tickets
- View and cancel bookings
- JWT token management

## API Endpoints

The app connects to your Django backend at: `https://54c742aad18d.ngrok-free.app`

### Available Endpoints:
- `/lol/api/token/` - Get JWT token
- `/lol/api/register/` - Register user
- `/lol/api/login/` - Login user
- `/lol/api/browse/` - Browse museums
- `/lol/api/book_museum/{id}/` - Book museum
- `/lol/api/my_bookings/` - Get user bookings
- `/lol/api/cancel_booking/{id}/` - Cancel booking

## Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd c:\Users\NITRO V\Desktop\django\frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## Configuration

The API base URL is configured in `src/config.js`. Update this file if your backend URL changes.

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Museums**: View available museums and their details
3. **Book Museums**: Click "Book Museum" to make a reservation
4. **Manage Bookings**: View and cancel your bookings in the "My Bookings" tab

## Notes

- The app automatically handles JWT token storage and authentication
- CORS headers are configured to work with your Django backend
- The ngrok-skip-browser-warning header is included to bypass ngrok warnings
