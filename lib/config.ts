export const config = {
  panels: {
    admin: { url: process.env.ADMIN_PANEL_URL || 'http://localhost:3000' },
    builder: { url: process.env.BUILDER_PANEL_URL || 'http://localhost:3001' },
    visitor: { url: process.env.VISITOR_PANEL_URL || 'http://localhost:3002' },
  },
  secrets: {
    internal: process.env.INTERNAL_API_SECRET,
    jwt: process.env.JWT_SECRET || '!99f9aK2!lPq91@xZ!mN8vR5$uT3cH6bW0eY',
  },
  features: {
    syncEnabled: process.env.SYNC_ENABLED !== 'false',
    idempotencyEnabled: process.env.IDEMPOTENCY_ENABLED !== 'false',
  },
} as const;
