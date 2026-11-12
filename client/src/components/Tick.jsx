// 勾选时在字上画一个蓝色圆珠笔的钩，和纸质便签本上的一样。清单和时间表共用
export default function Tick() {
  return (
    <svg className="tick" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 15 Q12 23 21 31 Q48 13 117 2" pathLength="1" />
    </svg>
  );
}
