import axios from 'axios';
import { API_ENDPOINTS, getHeaders } from './config';

// Create axios instance with default config
const api = axios.create({
  timeout: 10000,
});

// Authentication Services
export const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        username,
        password
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Register user
  register: async (username, email, password1, password2) => {
    try {
      // Validate passwords match on frontend
      if (password1 !== password2) {
        throw new Error('Passwords do not match.');
      }
      
      const response = await api.post(API_ENDPOINTS.REGISTER, {
        username,
        email,
        password: password1  // Django UserSerializer expects 'password', not 'password1'
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get JWT token
  getToken: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.TOKEN_OBTAIN, {
        username,
        password
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refresh JWT token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post(API_ENDPOINTS.TOKEN_REFRESH, {
        refresh: refreshToken
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Museum Services
export const museumService = {
  // Browse all museums
  browseMuseums: async (token) => {
    try {
      const response = await api.get(API_ENDPOINTS.BROWSE_MUSEUMS, {
        headers: getHeaders(token)
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Book a museum
  bookMuseum: async (museumId, token) => {
    try {
      const response = await api.post(API_ENDPOINTS.BOOK_MUSEUM(museumId), {}, {
        headers: getHeaders(token)
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user bookings
  getMyBookings: async (token) => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_BOOKINGS, {
        headers: getHeaders(token)
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel a booking
  cancelBooking: async (bookingId, token) => {
    try {
      const response = await api.post(API_ENDPOINTS.CANCEL_BOOKING(bookingId), {}, {
        headers: getHeaders(token)
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;
