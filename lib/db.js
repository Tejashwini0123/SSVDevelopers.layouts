import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Configure public DNS servers (Google & Cloudflare) ONLY in development/local environments
  // to bypass Windows dual-stack resolveSrv querySrv ECONNREFUSED bug.
  // We skip this in Vercel production serverless environments to prevent sandbox network violations.
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('Warning: Could not set fallback DNS servers:', dnsErr.message);
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      // Check for and drop old unique index "plotNo_1" that was created in previous runs.
      // MongoDB does not drop old indexes automatically when Mongoose schemas change.
      try {
        const db = mongooseInstance.connection.db;
        const collections = await db.listCollections({ name: "plots" }).toArray();
        if (collections.length > 0) {
          const indexes = await db.collection("plots").indexes();
          const hasOldIndex = indexes.some(idx => idx.name === "plotNo_1");
          if (hasOldIndex) {
            console.log("INFO: Found old unique index 'plotNo_1'. Dropping it to allow duplicate plot numbers across layout sheets...");
            await db.collection("plots").dropIndex("plotNo_1");
            console.log("INFO: Successfully dropped old 'plotNo_1' index.");
          }
        }
      } catch (indexErr) {
        console.warn("Warning: Could not drop old unique plotNo_1 index:", indexErr.message);
      }
      return mongooseInstance;
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

export default dbConnect;
