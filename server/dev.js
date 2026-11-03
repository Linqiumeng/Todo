// 本地开发用的 API 服务器（线上由 api/index.js 作为 Vercel 函数运行）
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import app from './app.js';

const PORT = 3002;

if (!process.env.PASSCODE) {
  process.env.PASSCODE = 'dev';
  console.warn('⚠ 未设置 PASSCODE，开发环境口令为 dev');
}

// 没有配置 Atlas 时，启动一个数据持久化在 .data/db 的本地 MongoDB。
// 端口用 27019，和菜谱站的本地库（27018）错开，两个站可以同时开发。
if (!process.env.MONGODB_URI) {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = fileURLToPath(new URL('../.data/db', import.meta.url));
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('未设置 MONGODB_URI，启动本地数据库（首次运行需下载 MongoDB，稍等）…');
  const mongod = await MongoMemoryServer.create({ instance: { dbPath, port: 27019, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri('todo');

  const shutdown = async () => {
    await mongod.stop({ doCleanup: false });
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

app.listen(PORT, () => console.log(`API 已启动：http://localhost:${PORT}/api`));
