// 用拼音输入法选字时按的回车不算提交。
// Safari 选字的回车 isComposing 为 false，但 keyCode 是 229，两个都要判断。
export function isImeEnter(e) {
  return e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229);
}
