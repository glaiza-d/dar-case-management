import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Users, UserCircle } from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import DARLogo from "../assets/HEADER 4A.png";

function Layout({ children }) {
  const navigate = useNavigate();
  const userFullName = localStorage.getItem("userFullName") || localStorage.getItem("username") || "User";
  const userRole = localStorage.getItem("userRole") || "Viewer";
  const isAdmin = userRole === "Admin";

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("username");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/cases" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FolderOpen size={20} />
            Cases
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={20} />
              Users
            </NavLink>
          )}
          <NavLink to="/account" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <UserCircle size={20} />
            My Account
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-container">
        {/* Header with Logo */}
        <header className="header">
          <div className="header-logo">
            <img src={DARLogo} alt="DAR Logo" className="dar-logo" />
          </div>
          <div className="header-user">
            <span className="user-name">{userFullName} ({userRole})</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="content">
          {children}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>Department of Agrarian Reform - Case Management System</p>
          <p>© 2026 DAR. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
