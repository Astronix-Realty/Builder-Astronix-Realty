import { SignJWT, jwtVerify } from 'jose';
import { config } from '@/lib/config';

export async function createServiceToken(sourcePanel: string, action: string) {
  const secretKey = new TextEncoder().encode(config.secrets.internal);
  return await new SignJWT({ sourcePanel, action })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey);
}

export async function verifyServiceToken(token: string) {
  try {
    const secretKey = new TextEncoder().encode(config.secrets.internal);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    return payload;
  } catch (error) {
    return null;
  }
}
