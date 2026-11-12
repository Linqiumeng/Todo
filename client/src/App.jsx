import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import PasscodeGate from './components/PasscodeGate.jsx';
import Schedule from './components/Schedule.jsx';
import Toast from './components/Toast.jsx';
import { PASSCODE_EVENT, hasPasscode } from './lib/api.js';
import { CategoriesProvider } from './lib/CategoriesContext.jsx';
import { TodosProvider } from './lib/TodosContext.jsx';
import History from './pages/History.jsx';
import Today from './pages/Today.jsx';

export default function App() {
  // 没存过口令，或者任何请求返回 401（口令改过了）时，显示口令页
  const [locked, setLocked] = useState(() => !hasPasscode());
  // 手机上清单和时间表放不下，/schedule 只显示时间表；宽屏上两边一直都在
  const timeView = useLocation().pathname === '/schedule';

  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(PASSCODE_EVENT, lock);
    return () => window.removeEventListener(PASSCODE_EVENT, lock);
  }, []);

  return (
    <>
      {locked ? (
        <PasscodeGate onUnlock={() => setLocked(false)} />
      ) : (
        <CategoriesProvider>
          <TodosProvider>
            <div className={`page ${timeView ? 'is-time' : ''}`}>
              <div className="main-col">
                <Header />
                <main className="container">
                  <Routes>
                    <Route path="/" element={<Today />} />
                    <Route path="/schedule" element={<Today />} />
                    <Route path="/history" element={<History />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
              <aside className="strip-col" aria-label="时间表">
                <Schedule />
              </aside>
            </div>
          </TodosProvider>
        </CategoriesProvider>
      )}
      <Toast />
    </>
  );
}
