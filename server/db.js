import mongoose from 'mongoose';

// Serverless 环境下函数实例会被复用，把连接缓存在全局，避免每个请求都重连。
const cached = globalThis._mongoose ?? (globalThis._mongoose = { conn: null, promise: null });

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (cached.conn) return cached.conn;
  if (!uri) throw new Error('缺少 MONGODB_URI 环境变量');
  cached.promise ??= mongoose.connect(uri, { bufferCommands: false });
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
