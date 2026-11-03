import { useEffect, useState } from 'react';
import { TOAST_EVENT } from '../lib/toast.js';

const DURATION_MS = 3000;

export default function Toast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let timer;
    const show = (e) => {
      setMessage(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), DURATION_MS);
    };
    window.addEventListener(TOAST_EVENT, show);
    return () => {
      window.removeEventListener(TOAST_EVENT, show);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="toast-region" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
