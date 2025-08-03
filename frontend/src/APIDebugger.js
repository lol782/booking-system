import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config';
// Simple debug component to test API
function APIDebugger() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simpleTest = async () => {
    setLoading(true);
    try {
      console.log('=== Simple API Test ===');
      
      const response = await fetch(API_ENDPOINTS.BROWSE_MUSEUMS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'  // Add this header for ngrok
        }
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Raw response text:', text);
      
      let parsedData = null;
      let parseError = null;
      
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        parseError = e.message;
      }
      
      setResult({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        rawText: text.substring(0, 500) + (text.length > 500 ? '...' : ''), // Truncate for display
        parsedData: parsedData,
        parseError: parseError,
        isArray: Array.isArray(parsedData),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Simple test error:', error);
      setResult({
        error: error.message,
        type: error.name,
        stack: error.stack
      });
    }
    setLoading(false);
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing API connection...');
      
      // Test 1: Browse museums (now public endpoint)
      console.log('=== Testing Browse Museums (Public) ===');
      const browseResponse = await fetch(API_ENDPOINTS.BROWSE_MUSEUMS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('Browse Response status:', browseResponse.status);
      console.log('Browse Response ok:', browseResponse.ok);
      
      let browseData;
      let browseError = null;
      try {
        const browseText = await browseResponse.text();
        console.log('Browse raw text:', browseText);
        browseData = JSON.parse(browseText);
        console.log('Browse parsed JSON:', browseData);
      } catch (e) {
        browseError = e.message;
        console.error('Browse parsing error:', e);
        browseData = 'Failed to parse response';
      }
      
      // Test 2: Try to create a token
      console.log('=== Testing Token Creation ===');
      const tokenResponse = await fetch(API_ENDPOINTS.TOKEN_OBTAIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          username: 'admin', // Try with a real username
          password: 'admin123'
        })
      });
      
      console.log('Token Response status:', tokenResponse.status);
      
      let tokenData;
      let tokenError = null;
      try {
        const tokenText = await tokenResponse.text();
        console.log('Token raw text:', tokenText);
        tokenData = JSON.parse(tokenText);
        console.log('Token parsed JSON:', tokenData);
      } catch (e) {
        tokenError = e.message;
        console.error('Token parsing error:', e);
        tokenData = 'Failed to parse response';
      }
      
      setResult({
        browse: {
          status: browseResponse.status,
          ok: browseResponse.ok,
          isArray: Array.isArray(browseData),
          dataType: typeof browseData,
          data: browseData,
          error: browseError
        },
        token: {
          status: tokenResponse.status,
          ok: tokenResponse.ok,
          data: tokenData,
          error: tokenError
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('API Error:', error);
      setResult({
        error: error.message,
        stack: error.stack
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Debugger</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={simpleTest} disabled={loading} style={{ marginRight: '10px' }}>
          {loading ? 'Testing...' : 'Simple Test'}
        </button>
        <button onClick={testAPI} disabled={loading}>
          {loading ? 'Testing...' : 'Full Test'}
        </button>
      </div>
      
      {result && (
        <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '10px', maxHeight: '500px', overflow: 'auto' }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Expected:</strong> Museums API should return status 200 with an array of museum objects</p>
        <p><strong>URL:</strong> {API_ENDPOINTS.BROWSE_MUSEUMS}</p>
        <p><strong>Backend URL:</strong> {process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}</p>
      </div>
    </div>
  );
}

export default APIDebugger;
