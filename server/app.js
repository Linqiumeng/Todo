import express from 'express';
import { connectDB } from './db.js';
import { requirePasscode } from './middleware/passcode.js';
import categoriesRouter from './routes/categories.js';
import todosRouter from './routes/todos.js';

const app = express();

app.use(express.json({ limit: '100kb' }));

// 所有接口都要口令；口令不对的请求不连数据库
app.use('/api', requirePasscode);

// 前端输入口令后用它验证
app.get('/api/check', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/categories', categoriesRouter);
app.use('/api/todos', todosRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join('；') });
  }
  if (err.code === 11000) return res.status(400).json({ error: '已经有同名的分类了' });
  if (err.name === 'CastError') return res.status(404).json({ error: '没有找到这条记录' });
  console.error(err);
  res.status(500).json({ error: '服务器出错了' });
});

export default app;
