import crypto from 'node:crypto';

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest();

// 前端把口令 encodeURIComponent 后放在 X-Passcode 头里（请求头不能直接放中文）
function readPasscode(req) {
  try {
    return decodeURIComponent(req.get('x-passcode') ?? '');
  } catch {
    return '';
  }
}

export function requirePasscode(req, res, next) {
  const expected = process.env.PASSCODE;
  if (!expected) return res.status(500).json({ error: '服务器未配置 PASSCODE' });

  // 先哈希再比较，长度一致才能用 timingSafeEqual
  if (!crypto.timingSafeEqual(sha256(readPasscode(req)), sha256(expected))) {
    return res.status(401).json({ error: '口令不对' });
  }
  next();
}
