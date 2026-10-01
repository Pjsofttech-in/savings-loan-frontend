// src/Components/navbar.jsx
import logo from "../assets/Pj Soft.png";

function Navbar({ activeView, onNavigate }) {
  // Added "settings" to the navItems array
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "registration", label: "Member registration" },
    { id: "shares", label: "Shares application" },
    { id: "list", label: "Transaction & User List" }, 
   
  ];

  return (
    <>
      <header className="top-navbar">
        <button
          className="navbar-brand"
          type="button"
          onClick={() => onNavigate("dashboard")}
          aria-label="Go to PJSoftTech dashboard"
        >
          <img src={logo} alt="PJSoftTech logo" />
          <span>
            <strong>PJSoftTech. Pvt.Ltd</strong>
            <small>Private Members Savings &amp; Loan Group</small>
          </span>
        </button>
        <div className="nav-user">
          <span className="user-avatar">A</span>
          <span>Administrator</span>
        </div>
      </header>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? "active" : ""}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

export default Navbar;