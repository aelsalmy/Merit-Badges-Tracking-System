import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="nav-bar">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Scout View
      </NavLink>
      <NavLink to="/team" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Team View
      </NavLink>
    </nav>
  );
}
