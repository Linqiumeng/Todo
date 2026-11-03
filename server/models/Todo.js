import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, '待办内容不能为空'], trim: true, maxlength: [200, '待办最多 200 个字'] },
    // null 表示「未分类」
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    done: { type: Boolean, default: false },
    // 勾选时写入，取消勾选时清空；完成记录按它排序和分组
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

todoSchema.index({ done: 1, completedAt: -1 });

export default mongoose.models.Todo ?? mongoose.model('Todo', todoSchema);
