// Simple test to verify API connection
// Run this in browser console to test

const testAPI = async () => {
  const API_BASE = 'https://54c742aad18d.ngrok-free.app';
  
  console.log('Testing API connection...');
  
  try {
    // Test 1: Simple GET request to token endpoint (should return method not allowed)
    console.log('Test 1: Testing token endpoint accessibility...');
    const response1 = await fetch(`${API_BASE}/lol/api/token/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Token endpoint response status:', response1.status);
    
    // Test 2: Try to get museums (should require auth)
    console.log('Test 2: Testing browse museums endpoint...');
    const response2 = await fetch(`${API_BASE}/lol/api/browse/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Browse museums response status:', response2.status);
    console.log('Browse museums response:', await response2.text());
    
    // Test 3: Test token creation with dummy credentials
    console.log('Test 3: Testing token creation...');
    const response3 = await fetch(`${API_BASE}/lol/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    console.log('Token creation response status:', response3.status);
    console.log('Token creation response:', await response3.text());
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

// Export for use
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
}

export default testAPI;
