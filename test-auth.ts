import dbConnect from './lib/db';
import { registerUser } from './services/authService';

async function run() {
  try {
    await dbConnect();
    const result = await registerUser({
      userType: 'builder',
      companyName: 'Test Corp',
      developerName: 'Test Dev',
      email: 'test' + Date.now() + '@example.com',
      phone: '+919876543210',
      password: 'password123',
      confirmPassword: 'password123',
      reraNumber: 'P1234567890',
      city: 'Pune',
      state: 'MH',
      experience: '5'
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("Failed:", error);
  }
}

run();
