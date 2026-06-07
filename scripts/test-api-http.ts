async function testLoginAndFetch() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@astronixrealty.com', password: 'password123', userType: 'builder' })
  });
  
  if (!loginRes.ok) {
    console.log("Login failed", loginRes.status, await loginRes.text());
    return;
  }
  
  const cookies = loginRes.headers.get('set-cookie');
  console.log("Logged in. Cookies:", cookies);
  
  const propertyId = "6a244af26a591ac2a1c82414";
  console.log(`Fetching inventory for ${propertyId}...`);
  
  const invRes = await fetch(`http://localhost:3000/api/inventory/${propertyId}`, {
    headers: { 'Cookie': cookies || '' }
  });
  
  console.log("Status:", invRes.status);
  const data = await invRes.text();
  console.log("Response:", data);
}
testLoginAndFetch();
