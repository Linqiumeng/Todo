import { Link, NavLink } from 'react-router-dom';
import { SITE_TITLE } from '../config.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
  return (
    <header className="container topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">To-do</span>
        <span className="brand-sub">{SITE_TITLE}</span>
      </Link>
      <nav className="nav">
        <NavLink to="/" end>待办</NavLink>
        <NavLink to="/history">记录</NavLink>
      </nav>
      <ThemeToggle />
    </header>
  );
}
