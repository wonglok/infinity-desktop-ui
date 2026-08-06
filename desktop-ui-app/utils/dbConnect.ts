import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var _mongooseConn: typeof mongoose | Promise<typeof mongoose> | undefined;
}

let cached = globalThis._mongooseConn;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached) return cached;

  cached = globalThis._mongooseConn = mongoose.connect(MONGODB_URI, {
    dbName: "infinity-desktop",
  });

  return cached;
}
