// 带状态码的错误，由 app.js 的错误处理中间件转成 JSON 返回
export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
