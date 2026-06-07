const http = require('http');

const data = JSON.stringify({
  userType: 'builder',
  companyName: 'Test Corp',
  developerName: 'Test Dev',
  email: 'test' + Date.now() + '@example.com',
  phone: '9876543210',
  password: 'password123',
  confirmPassword: 'password123',
  reraNumber: 'P1234567890',
  city: 'Pune',
  state: 'MH',
  experience: '5'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
