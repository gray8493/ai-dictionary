// Test script for user-profile API
const fetch = require('node-fetch');

async function testUserProfile() {
  try {
    // Test GET request (this will fail without auth token, but shows if API is reachable)
    const response = await fetch('http://localhost:3000/api/user-profile');
    console.log('GET /api/user-profile:', response.status);

    // This is just to test if the server is running and API is accessible
    console.log('API is accessible');
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testUserProfile();