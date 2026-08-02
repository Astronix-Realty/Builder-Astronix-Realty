import { GET } from '../app/api/inventory/[propertyId]/route';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

jest.mock('../lib/rbac', () => ({
  checkRBAC: async () => ({ context: { role: 'builder', userId: '6a2449be6a591ac2a1c823e5' } }),
  getOwnershipQuery: () => ({ builderId: '6a2449be6a591ac2a1c823e5' })
}));

async function testRoute() {
  const req = new NextRequest('http://localhost:3000/api/inventory/6a244af26a591ac2a1c82414');
  try {
    const res = await GET(req, { params: Promise.resolve({ propertyId: "6a244af26a591ac2a1c82414" }) });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Towers returned:", data.towers?.length);
  } catch (error) {
    console.error("Error calling GET:", error);
  }
  process.exit(0);
}
testRoute();
