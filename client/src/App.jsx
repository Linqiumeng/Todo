import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import PasscodeGate from './components/PasscodeGate.jsx';
import Toast from './components/Toast.jsx';
import { PASSCODE_EVENT, hasPasscode } from './lib/api.js';
import { CategoriesProvider } from './lib/CategoriesContext.jsx';
import History from './pages/History.jsx';
import Today from './pages/Today.jsx';

export default function App() {
  // 没存过口令，或者任何请求返回 401（口令改过了）时，显示口令页
  const [locked, setLocked] = useState(() => !hasPasscode());

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
          <Header />
          <main className="container">
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </CategoriesProvider>
      )}
      <Toast />
    </>
  );
}
