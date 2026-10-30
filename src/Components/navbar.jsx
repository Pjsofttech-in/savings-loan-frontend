// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import logo from "../assets/Pj Soft.png";

function Navbar({ activeView, onNavigate }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "registration", label: "Member registration" },
    { id: "shares", label: "Shares application" },
    { id: "savings", label: "Monthly Savings" },
    { id: "settings", label: "Settings" },
  ];
  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };
    const closeOnOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, []);

  return (
    <>
      <header className="top-navbar">
        <button
          className="navbar-brand"
          type="button"
          onClick={() => {
            setProfileOpen(false);
            onNavigate("dashboard");
          }}
          aria-label="Go to PJSoftTech dashboard"
        >
          <img src={logo} alt="PJSoftTech logo" />
          <span>
            <strong>PJSoftTech. Pvt.Ltd</strong>
            <small>Private Members Savings &amp; Loan Group</small>
          </span>
        </button>
        {activeView === "settings" ? (
          <div className="nav-user" ref={profileRef}>
            <button
              type="button"
              className="nav-user-trigger"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="user-avatar">A</span>
              <span className="nav-user-copy"><strong>Administrator</strong><small>Admin account</small></span>
              <span className="nav-user-chevron" aria-hidden="true">⌄</span>
            </button>
            {profileOpen && (
              <div className="admin-profile-popover" role="status">
                <strong>Administrator</strong>
                <span>Management workspace</span>
              </div>
            )}
          </div>
        ) : (
          <div className="nav-user">
            <span className="user-avatar">A</span>
            <span>Administrator</span>
          </div>
        )}
      </header>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? "active" : ""}
              onClick={() => {
                setProfileOpen(false);
                onNavigate(item.id);
              }}
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
