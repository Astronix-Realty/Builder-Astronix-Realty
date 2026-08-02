import { GET } from '../app/api/inventory/[propertyId]/route';
import { NextRequest } from 'next/server';

// Mock context so RBAC passes
jest.mock('../lib/rbac', () => ({
  checkRBAC: async () => ({
    context: { role: 'builder', userId: '6a2449be6a591ac2a1c823e5' }
  }),
  getOwnershipQuery: () => ({ builderId: '6a2449be6a591ac2a1c823e5' })
}));

async function testApi() {
  const req = new NextRequest('http://localhost:3000/api/inventory/6a244af26a591ac2a1c82414');
  // Need to call it with proper mocked modules, but tsx might not support jest.mock easily.
}
