import { Router } from 'express';
import Category from '../models/Category.js';
import Todo from '../models/Todo.js';
import { httpError } from '../httpError.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await Category.find().sort({ createdAt: 1 }));
});

router.post('/', async (req, res) => {
  const { name, color } = req.body ?? {};
  res.status(201).json(await Category.create({ name, color }));
});

router.patch('/:id', async (req, res) => {
  const body = req.body ?? {};
  const update = Object.fromEntries(['name', 'color'].filter((k) => k in body).map((k) => [k, body[k]]));
  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!category) throw httpError(404, '没有找到这个分类');
  res.json(category);
});

router.delete('/:id', async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw httpError(404, '没有找到这个分类');
  // 分类里的待办（包括已完成的记录）都移到「未分类」
  await Todo.updateMany({ category: category._id }, { category: null });
  await category.deleteOne();
  res.json({ ok: true });
});

export default router;
