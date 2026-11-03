import { dotDate, weekday } from '../lib/dates.js';

const RINGS = 9;

// 一本便签本：最底下是灰纸板，上面一叠纸，最上面一页是正在写的；顶上一排线圈穿过纸上的孔。
// 正文里每个元素的高度都是行高（--line）的整数倍，字才能一直落在横线上。
export default function Sheet({ children }) {
  return (
    <section className="pad">
      <div className="pad-board" aria-hidden="true" />
      <div className="pad-pages" aria-hidden="true" />
      <div className="sheet">
        <div className="sheet-body">{children}</div>
      </div>
      <div className="spiral" aria-hidden="true">
        {Array.from({ length: RINGS }, (_, i) => (
          <span key={i} className="coil">
            <i className="hole" />
            <i className="ring" />
          </span>
        ))}
      </div>
    </section>
  );
}

// 第一行的日期：2026.11.03 Tuesday
export function DateLine({ date, relative, meta }) {
  return (
    <div className="date-line">
      <span className="date-num">{dotDate(date)}</span>
      <span className="date-day">{weekday(date)}</span>
      {relative && <span className="date-rel">{relative}</span>}
      {meta && <span className="date-meta">{meta}</span>}
    </div>
  );
}
