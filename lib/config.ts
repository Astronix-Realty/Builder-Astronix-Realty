/**
 * Centralized Application Configuration & Environment Management
 * Enforces single source of truth for Builder panel runtime environment.
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  database: {
    uri: process.env.MONGODB_URI || '',
    visitorUri: process.env.VISITOR_MONGODB_URI || '',
    adminUri: process.env.ADMIN_MONGODB_URI || '',
  },

  panels: {
    admin: { url: process.env.ADMIN_PANEL_URL || 'http://localhost:3000' },
    builder: { url: process.env.BUILDER_PANEL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' },
    visitor: { url: process.env.VISITOR_PANEL_URL || 'http://localhost:3002' },
  },

  secrets: {
    internal: process.env.INTERNAL_API_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'astronix-internal-2026-xK9mN3pQ'),
    jwt: process.env.JWT_SECRET || '!99f9aK2!lPq91@xZ!mN8vR5$uT3cH6bW0eY',
  },

  email: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.RESEND_FROM_EMAIL || 'no-reply@astronixrealty.com',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  google: {
    mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    placeId: process.env.NEXT_PUBLIC_GMB_PLACE_ID || '',
    profileId: process.env.GMB_PROFILE_ID || '',
  },

  features: {
    syncEnabled: process.env.SYNC_ENABLED !== 'false',
    idempotencyEnabled: process.env.IDEMPOTENCY_ENABLED !== 'false',
  },

  /**
   * Generates type-safe headers for internal Service-to-Service (S2S) requests.
   */
  getS2SHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'x-internal-secret': this.secrets.internal,
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
  },
} as const;

export default config;
