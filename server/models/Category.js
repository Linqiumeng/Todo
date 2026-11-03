import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '分类名不能为空'],
      trim: true,
      maxlength: [20, '分类名最多 20 个字'],
      unique: true,
    },
    color: { type: String, default: '#c9a27e', match: [/^#[0-9a-f]{6}$/i, '颜色格式不对'] },
  },
  { timestamps: true },
);

export default mongoose.models.Category ?? mongoose.model('Category', categorySchema);
