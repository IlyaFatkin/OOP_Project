import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="flex gap-4 p-4">
      <NavLink 
        to="/" 
        end 
        className={({ isActive }) => (isActive ? "text-blue-500" : "text-white")}
      >
        Галлерея
      </NavLink>
      <NavLink 
        to="/editor/new" 
        className={() => {
          const isEditorActive = window.location.pathname.startsWith('/editor/');
          return isEditorActive ? "text-blue-500" : "text-white";
        }}
      >
        Создать
      </NavLink>
      
    </nav>
  );
}