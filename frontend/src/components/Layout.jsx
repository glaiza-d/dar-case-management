import { NavLink, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Layout({ children }) {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>DAR CMS</h2>
          <p>Case Management</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Dashboard
          </NavLink>
          <NavLink to="/cases" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Cases
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Users
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            My Account
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-container">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Department of Agrarian Reform</h1>
            <h2>Case Management System</h2>
          </div>
          <div className="header-user">
            <span className="user-name">{user}</span>
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
