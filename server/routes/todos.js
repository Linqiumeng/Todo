import { Router } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Todo from '../models/Todo.js';
import { httpError } from '../httpError.js';

const router = Router();
const HISTORY_PAGE_SIZE = 50;

function parseDate(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
}

// null 或空字符串表示「未分类」
async function resolveCategory(value) {
  if (value == null || value === '') return null;
  if (!mongoose.isValidObjectId(value) || !(await Category.exists({ _id: value }))) {
    throw httpError(400, '分类不存在');
  }
  return value;
}

// 主列表：所有未完成的，加上 since 之后完成的。
// since 由前端传本地时间的今天 0 点，服务端不用关心时区。
router.get('/', async (req, res) => {
  const since = parseDate(req.query.since);
  if (!since) throw httpError(400, '缺少 since 参数');
  const todos = await Todo.find({ $or: [{ done: false }, { completedAt: { $gte: since } }] }).sort({ createdAt: -1 });
  res.json(todos);
});

// 完成记录：按完成时间倒序，用 before（上一页最后一条的完成时间）翻页
router.get('/history', async (req, res) => {
  const filter = { done: true };
  const before = parseDate(req.query.before);
  if (before) filter.completedAt = { $lt: before };
  if (req.query.category === 'none') filter.category = null;
  else if (req.query.category) filter.category = req.query.category;

  const items = await Todo.find(filter).sort({ completedAt: -1 }).limit(HISTORY_PAGE_SIZE + 1);
  res.json({ items: items.slice(0, HISTORY_PAGE_SIZE), hasMore: items.length > HISTORY_PAGE_SIZE });
});

router.post('/', async (req, res) => {
  const { title, category } = req.body ?? {};
  const todo = await Todo.create({ title, category: await resolveCategory(category) });
  res.status(201).json(todo);
});

router.patch('/:id', async (req, res) => {
  const body = req.body ?? {};
  const todo = await Todo.findById(req.params.id);
  if (!todo) throw httpError(404, '没有找到这条待办');

  if ('title' in body) todo.title = body.title;
  if ('category' in body) todo.category = await resolveCategory(body.category);
  if ('done' in body && Boolean(body.done) !== todo.done) {
    todo.done = Boolean(body.done);
    todo.completedAt = todo.done ? new Date() : null;
  }
  await todo.save();
  res.json(todo);
});

router.delete('/:id', async (req, res) => {
  const { deletedCount } = await Todo.deleteOne({ _id: req.params.id });
  if (!deletedCount) throw httpError(404, '没有找到这条待办');
  res.json({ ok: true });
});

export default router;
