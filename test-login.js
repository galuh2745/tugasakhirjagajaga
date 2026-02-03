// Test login script
const https = require('https');
const http = require('http');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const postData = JSON.stringify({
      email: 'admin@admin.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Raw Response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();
