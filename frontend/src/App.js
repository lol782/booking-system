import React, { useState, useEffect } from 'react';
import { authService, museumService } from './services';
import { API_ENDPOINTS } from './config';
import APIDebugger from './APIDebugger';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [museums, setMuseums] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password1: '', 
    password2: '' 
  });

  // Navigation and UI state
  const [activeTab, setActiveTab] = useState('home');
  const [sideCanvasOpen, setSideCanvasOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: 'Hello! How can I help you today?', type: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Load museums on app start (now public endpoint)
  useEffect(() => {
    console.log('App mounted, loading museums...');
    loadMuseums();
  }, []);

  // Load bookings only when user has token
  useEffect(() => {
    if (token && user) {
      console.log('Token available, loading bookings...');
      loadBookings();
    } else {
      console.log('No token or user available');
      setBookings([]);
    }
  }, [token, user]);

  // Chat message handling
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { text: userMessage, type: 'user' }]);
    setChatInput('');

    // Add typing indicator
    setChatMessages(prev => [...prev, { text: 'Typing...', type: 'bot', isTyping: true }]);

    try {
      if (!token) {
        throw new Error('Please log in to use the chat');
      }

      const response = await fetch('https://2dce550080ed.ngrok-free.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_query: userMessage,
          token: token
        })
      });

      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));

      if (response.ok) {
        const data = await response.json();
        const botResponse = data.response || data.answer || data.message || 'I received your message!';
        setChatMessages(prev => [...prev, { text: botResponse, type: 'bot' }]);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      
      let errorMessage = 'Sorry, I encountered an error. ';
      if (error.message.includes('log in')) {
        errorMessage += 'Please log in to continue chatting.';
      } else {
        errorMessage += 'Please try again later.';
      }
      setChatMessages(prev => [...prev, { text: errorMessage, type: 'bot' }]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Try to get JWT token using the login API
      const tokenData = await authService.getToken(loginForm.username, loginForm.password);
      setToken(tokenData.access);
      localStorage.setItem('access_token', tokenData.access);
      localStorage.setItem('refresh_token', tokenData.refresh);
      setUser({ username: loginForm.username });
      setSuccess('Login successful!');
      setLoginForm({ username: '', password: '' });
      setActiveTab('home'); // Redirect to home after login
      
      // Load bookings immediately after successful login
      console.log('Login successful, loading bookings...');
      await loadBookingsWithToken(tokenData.access);
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err?.error || err?.detail || err?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Basic validation
    if (registerForm.password1 !== registerForm.password2) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Use the register API endpoint which returns tokens directly
      const response = await authService.register(
        registerForm.username, 
        registerForm.email, 
        registerForm.password1, 
        registerForm.password2
      );
      
      // If registration is successful and returns tokens, log the user in automatically
      if (response.access && response.refresh) {
        setToken(response.access);
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        setUser({ username: registerForm.username });
        setSuccess('Registration successful! You are now logged in.');
        setActiveTab('home');
      } else {
        setSuccess('Registration successful! Please login.');
        setActiveTab('login');
      }
      
      setRegisterForm({ username: '', email: '', password1: '', password2: '' });
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different types of error responses
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object') {
        if (err.username) {
          errorMessage = `Username: ${Array.isArray(err.username) ? err.username.join(', ') : err.username}`;
        } else if (err.email) {
          errorMessage = `Email: ${Array.isArray(err.email) ? err.email.join(', ') : err.email}`;
        } else if (err.password) {
          errorMessage = `Password: ${Array.isArray(err.password) ? err.password.join(', ') : err.password}`;
        } else if (err.non_field_errors) {
          errorMessage = Array.isArray(err.non_field_errors) ? err.non_field_errors.join(', ') : err.non_field_errors;
        } else if (err.detail) {
          errorMessage = err.detail;
        } else if (err.error) {
          errorMessage = err.error;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setMuseums([]);
    setBookings([]);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setSuccess('Logged out successfully!');
    setSideCanvasOpen(false);
    setActiveTab('home');
  };

  const loadMuseumsWithToken = async (authToken) => {
    try {
      const museumsData = await museumService.browseMuseums(authToken);
      console.log('Museums API response:', museumsData);
      if (Array.isArray(museumsData)) {
        setMuseums(museumsData);
      } else {
        console.warn('Museums API did not return an array:', museumsData);
        setMuseums([]);
        setError('Invalid museums data format received');
      }
    } catch (err) {
      console.error('Error loading museums:', err);
      setError('Failed to load museums');
      setMuseums([]);
    }
  };

  const loadBookingsWithToken = async (authToken) => {
    try {
      const bookingsData = await museumService.getMyBookings(authToken);
      console.log('Bookings API response:', bookingsData);
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      } else {
        console.warn('Bookings API did not return an array:', bookingsData);
        setBookings([]);
        setError('Invalid bookings data format received');
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
      setBookings([]);
    }
  };

  const loadMuseums = async () => {
    try {
      console.log('Loading museums...');
      // Since browse is now public, we can call it without token
      const response = await fetch(API_ENDPOINTS.BROWSE_MUSEUMS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('Museums response status:', response.status);
      
      if (response.ok) {
        const museumsData = await response.json();
        console.log('Museums data:', museumsData);
        
        if (Array.isArray(museumsData)) {
          setMuseums(museumsData);
        } else {
          console.warn('Museums API did not return an array:', museumsData);
          setMuseums([]);
          setError('Invalid museums data format received');
        }
      } else {
        const errorText = await response.text();
        console.error('Museums API error:', response.status, errorText);
        setError(`Failed to load museums: ${response.status}`);
        setMuseums([]);
      }
    } catch (err) {
      console.error('Error loading museums:', err);
      setError('Failed to connect to museums API');
      setMuseums([]);
    }
  };

  const loadBookings = async () => {
    if (!token) {
      console.log('No token available for bookings');
      setBookings([]);
      return;
    }
    return loadBookingsWithToken(token);
  };

  const handleBookMuseum = async (museumId) => {
    setLoading(true);
    setError('');
    try {
      await museumService.bookMuseum(museumId, token);
      setSuccess('Museum booked successfully!');
      loadBookings(); // Refresh bookings
    } catch (err) {
      console.error('Booking error:', err);
      setError(typeof err === 'string' ? err : 'Failed to book museum');
    }
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId) => {
    setLoading(true);
    setError('');
    try {
      await museumService.cancelBooking(bookingId, token);
      setSuccess('Booking cancelled successfully!');
      loadBookings(); // Refresh bookings
    } catch (err) {
      console.error('Cancel booking error:', err);
      setError(typeof err === 'string' ? err : 'Failed to cancel booking');
    }
    setLoading(false);
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Render Home Page Content
  const renderHomePage = () => (
    <div className="hero-section">
      <h1 className="hero-title">Welcome to Museum Explorer</h1>
      <p className="hero-subtitle">
        Discover amazing museums around the world and book your perfect cultural experience
      </p>
      <button 
        className="hero-btn"
        onClick={() => setActiveTab('browse')}
      >
        Start Exploring Museums
      </button>
    </div>
  );

  // Render About Page Content
  const renderAboutPage = () => (
    <div className="content-section">
      <h2 className="section-title">About Museum Explorer</h2>
      <p className="section-text">
        Museum Explorer is your gateway to discovering and experiencing the world's most fascinating museums. 
        Our platform connects culture enthusiasts with premier museums, offering seamless booking experiences 
        and curated content to enhance your cultural journey.
      </p>
      <p className="section-text">
        Founded with a passion for education and cultural preservation, we believe that museums are vital 
        institutions that preserve our heritage, inspire creativity, and foster learning. Whether you're 
        interested in art, history, science, or technology, we help you find the perfect museum experience.
      </p>
      <p className="section-text">
        Join thousands of culture lovers who have discovered their next favorite museum through our platform. 
        Start your journey today and unlock the doors to knowledge and wonder.
      </p>
      <button 
        className="btn btn-primary"
        onClick={() => setActiveTab('browse')}
        style={{ marginTop: '1rem' }}
      >
        Browse Museums
      </button>
    </div>
  );

  // Render Contact Page Content
  const renderContactPage = () => (
    <div className="content-section">
      <h2 className="section-title">Contact Us</h2>
      <p className="section-text">
        We'd love to hear from you! Get in touch with our team for any questions, suggestions, or support.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Customer Support</h3>
          <p className="section-text">📧 support@museumexplorer.com</p>
          <p className="section-text">📞 +1 (555) 123-4567</p>
          <p className="section-text">🕒 Mon-Fri: 9AM-6PM EST</p>
        </div>
        
        <div>
          <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Partnership Inquiries</h3>
          <p className="section-text">📧 partnerships@museumexplorer.com</p>
          <p className="section-text">📞 +1 (555) 123-4568</p>
        </div>
        
        <div>
          <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>General Information</h3>
          <p className="section-text">📧 info@museumexplorer.com</p>
          <p className="section-text">📍 123 Culture Street, Art District, NY 10001</p>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
        <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Quick Message</h3>
        <p className="section-text">
          For quick assistance, try our chat support available in the bottom right corner, 
          or send us a message through our contact form.
        </p>
      </div>
    </div>
  );

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="navbar">
        <button 
          className="navbar-brand" 
          style={{ background: 'none', border: 'none' }}
          onClick={() => setActiveTab('home')}
        >
          Museum Explorer
        </button>

        {/* Welcome Message */}
        <div className="navbar-welcome">
          {token && user ? (
            <span className="welcome-text">Welcome, {user.username}! 👋</span>
          ) : (
            <span className="welcome-text">Please login to access all features</span>
          )}
        </div>
        
        <ul className="navbar-nav">
          <li>
            <button 
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact
            </button>
          </li>
          {token && (
            <>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Museums
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'debug' ? 'active' : ''}`}
                  onClick={() => setActiveTab('debug')}
                >
                  API Debug
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Neon User Profile Button */}
        <button 
          className="user-profile-btn"
          onClick={() => setSideCanvasOpen(true)}
        >
          {token && user ? `👋 ${user.username}` : '👤 Account'}
        </button>
      </nav>

      {/* Side Canvas Overlay */}
      <div 
        className={`side-canvas-overlay ${sideCanvasOpen ? 'open' : ''}`}
        onClick={() => setSideCanvasOpen(false)}
      ></div>

      {/* Side Canvas */}
      <div className={`side-canvas ${sideCanvasOpen ? 'open' : ''}`}>
        <div className="canvas-header">
          <h3>{token && user ? `Welcome, ${user.username}!` : 'Account Options'}</h3>
          <button 
            className="canvas-close"
            onClick={() => setSideCanvasOpen(false)}
          >
            ×
          </button>
        </div>
        
        <div className="canvas-content">
          {token && user ? (
            <>
              <button 
                className="canvas-btn primary"
                onClick={() => {
                  setActiveTab('bookings');
                  setSideCanvasOpen(false);
                }}
              >
                📋 My Bookings
              </button>
              <button 
                className="canvas-btn danger"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <button 
                className="canvas-btn primary"
                onClick={() => {
                  setActiveTab('login');
                  setSideCanvasOpen(false);
                }}
              >
                🔑 Login
              </button>
              <button 
                className="canvas-btn primary"
                onClick={() => {
                  setActiveTab('register');
                  setSideCanvasOpen(false);
                }}
              >
                👤 Register
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'home' && renderHomePage()}
        {activeTab === 'about' && renderAboutPage()}
        {activeTab === 'contact' && renderContactPage()}
        
        {activeTab === 'login' && (
          <div className="auth-container">
            <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>Login to Museum Explorer</h1>
            
            <form onSubmit={handleLogin} className="auth-form">
              <h2>Welcome Back!</h2>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="auth-container">
            <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>Join Museum Explorer</h1>
            
            <form onSubmit={handleRegister} className="auth-form">
              <h2>Create Account</h2>
              <input
                type="text"
                placeholder="Username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password1}
                onChange={(e) => setRegisterForm({...registerForm, password1: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={registerForm.password2}
                onChange={(e) => setRegisterForm({...registerForm, password2: e.target.value})}
                required
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="content-section">
            <h2 className="section-title">Available Museums</h2>
            <button onClick={loadMuseums} className="btn btn-success" style={{ marginBottom: '1.5rem' }}>
              🔄 Refresh Museums
            </button>
            <div className="museums-grid">
              {Array.isArray(museums) && museums.length > 0 ? (
                museums.map((museum) => (
                  <div key={museum.museum_id} className="museum-card">
                    <h3>{museum.name}</h3>
                    <p>{museum.description}</p>
                    <p><strong>📍 Location:</strong> {museum.location}</p>
                    {token ? (
                      <button 
                        onClick={() => handleBookMuseum(museum.museum_id)}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        🎫 Book Museum
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('login')}
                        className="btn btn-primary"
                      >
                        🔑 Login to Book
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No museums available or loading...</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="content-section">
            {token ? (
              <>
                <h2 className="section-title">My Bookings</h2>
                <button onClick={loadBookings} className="btn btn-success" style={{ marginBottom: '1.5rem' }}>
                  🔄 Refresh Bookings
                </button>
                <div className="bookings-list">
                  {Array.isArray(bookings) && bookings.length === 0 ? (
                    <p>No bookings found.</p>
                  ) : Array.isArray(bookings) ? (
                    bookings.map((booking) => (
                      <div key={booking.booking_id} className="museum-card" style={{ marginBottom: '1rem' }}>
                        <h3>{booking.museum_name}</h3>
                        <p><strong>📍 Location:</strong> {booking.museum_location}</p>
                        <p><strong>📅 Visit Date:</strong> {booking.visit_date}</p>
                        <p><strong>🎫 Ticket Type:</strong> {booking.ticket_type}</p>
                        {booking.created_at && (
                          <p><strong>📝 Booked on:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
                        )}
                        <button 
                          onClick={() => handleCancelBooking(booking.booking_id)}
                          disabled={loading}
                          className="btn btn-danger"
                        >
                          ❌ Cancel Booking
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>Loading bookings...</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="section-title">My Bookings</h2>
                <p className="section-text">Please login to view your bookings.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('login')}
                  style={{ marginTop: '1rem' }}
                >
                  🔑 Login Now
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <APIDebugger />
        )}
      </main>

      {/* Chat Section */}
      <div className="chat-container">
        <button 
          className="chat-toggle"
          onClick={() => setChatOpen(!chatOpen)}
        >
          💬
        </button>
        
        <div className={`chat-window ${chatOpen ? 'open' : ''}`}>
          <div className="chat-header">
            Chat Support
          </div>
          
          <div className="chat-body">
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                style={{
                  marginBottom: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: message.type === 'user' ? '#667eea' : '#f1f3f4',
                  color: message.type === 'user' ? 'white' : '#333',
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  marginLeft: message.type === 'user' ? 'auto' : '0',
                  marginRight: message.type === 'user' ? '0' : 'auto'
                }}
              >
                {message.text}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleChatSubmit} className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder={token ? "Type your message..." : "Please login to chat"}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!token}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
