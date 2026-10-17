import mongoose from "mongoose";
import dns from "dns";

// Fix querySrv ETIMEOUT on Windows Node.js environments by setting public DNS resolvers
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if restricted
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 45000,
      connectTimeoutMS: 45000,
      socketTimeoutMS: 120000,
      maxPoolSize: 25,
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Global cached connection for Visitor Database
// @ts-ignore
let cachedVisitor = global.mongooseVisitor;
if (!cachedVisitor) {
  // @ts-ignore
  cachedVisitor = global.mongooseVisitor = { conn: null, promise: null };
}

export async function connectVisitorDB() {
  const VISITOR_URI = process.env.VISITOR_MONGODB_URI;

  if (!VISITOR_URI) {
    throw new Error("Please define the VISITOR_MONGODB_URI environment variable inside .env.local");
  }

  if (cachedVisitor.conn) {
    return cachedVisitor.conn;
  }

  if (!cachedVisitor.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      family: 4,
    };

    cachedVisitor.promise = mongoose.createConnection(VISITOR_URI, opts).asPromise().then((conn) => {
      return conn;
    });
  }

  try {
    cachedVisitor.conn = await cachedVisitor.promise;
  } catch (e) {
    cachedVisitor.promise = null;
    throw e;
  }

  return cachedVisitor.conn;
}

// Global cached connection for Admin Database
// @ts-ignore
let cachedAdmin = global.mongooseAdmin;
if (!cachedAdmin) {
  // @ts-ignore
  cachedAdmin = global.mongooseAdmin = { conn: null, promise: null };
}

export async function connectAdminDB() {
  const ADMIN_URI = process.env.ADMIN_MONGODB_URI;

  if (!ADMIN_URI) {
    throw new Error("Please define the ADMIN_MONGODB_URI environment variable inside .env.local");
  }

  if (cachedAdmin.conn) {
    return cachedAdmin.conn;
  }

  if (!cachedAdmin.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      family: 4,
    };

    cachedAdmin.promise = mongoose.createConnection(ADMIN_URI, opts).asPromise().then((conn) => {
      return conn;
    });
  }

  try {
    cachedAdmin.conn = await cachedAdmin.promise;
  } catch (e) {
    cachedAdmin.promise = null;
    throw e;
  }

  return cachedAdmin.conn;
}

export default dbConnect;
