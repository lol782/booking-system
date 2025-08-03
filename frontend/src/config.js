// API configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// API endpoints based on your Django URLs
export const API_ENDPOINTS = {
  // Authentication endpoints
  TOKEN_OBTAIN: `${API_BASE_URL}/lol/api/token/`,
  TOKEN_REFRESH: `${API_BASE_URL}/lol/api/token/refresh/`,
  REGISTER: `${API_BASE_URL}/lol/api/register/`,
  LOGIN: `${API_BASE_URL}/lol/api/login/`,
  
  // Museum endpoints
  BROWSE_MUSEUMS: `${API_BASE_URL}/lol/api/browse/`,
  BOOK_MUSEUM: (museumId) => `${API_BASE_URL}/lol/api/book_museum/${museumId}/`,
  MY_BOOKINGS: `${API_BASE_URL}/lol/api/my_bookings/`,
  CANCEL_BOOKING: (bookingId) => `${API_BASE_URL}/lol/api/cancel_booking/${bookingId}/`,
  
  // Web pages (if needed)
  BROWSE_PAGE: `${API_BASE_URL}/lol/browse/`,
  MUSEUM_DETAIL: (museumId) => `${API_BASE_URL}/lol/museum/${museumId}/`,
  BOOK_MUSEUM_PAGE: (museumId) => `${API_BASE_URL}/lol/book_museum/${museumId}/`,
};

// Default headers for API requests
export const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // Required for ngrok
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export { API_BASE_URL };
export default API_BASE_URL;
