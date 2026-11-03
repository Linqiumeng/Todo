import { useState } from 'react';
import { api, setPasscode } from '../lib/api.js';
import Sheet from './Sheet.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    setError('');
    setPasscode(value);
    try {
      await api.check();
      onUnlock();
    } catch (err) {
      setPasscode('');
      setError(err.status === 401 ? '口令不对，再试一次' : err.message);
      setBusy(false);
    }
  };

  return (
    <main className="gate">
      <ThemeToggle />
      <Sheet>
        <form className="gate-form" onSubmit={submit}>
          <h1 className="gate-title">To-do</h1>
          <p className="gate-hint">输入口令，这台设备会记住它</p>
          <input
            type="password"
            className="line-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="口令"
            autoComplete="current-password"
            aria-label="口令"
            autoFocus
          />
          <p className="gate-error error" role="alert">{error}</p>
          <div className="gate-actions">
            <button className="btn btn-primary" disabled={busy || !value}>
              {busy ? '验证中…' : '进入'}
            </button>
          </div>
        </form>
      </Sheet>
    </main>
  );
}
