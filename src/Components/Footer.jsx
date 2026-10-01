import logo from "../assets/Pj Soft.png";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <div className="footer-brand">
            <img src={logo} alt="PJSoftTech logo" />
            <div>
              <strong>PJSoftTech</strong>
              <span>Private Members Savings &amp; Loan Group</span>
            </div>
          </div>
          <p>
            A focused workspace for managing member registration, savings, and
            loan records with clarity.
          </p>
        </div>

        <div className="footer-column">
          <h2>Workspace</h2>
          <span>Member registration</span>
          <span>Member records</span>
          <span>Savings overview</span>
        </div>

        <div className="footer-column">
          <h2>Need assistance?</h2>
          <span>Contact your group administrator</span>
          <span>Keep member details up to date</span>
          <span>Review submissions before saving</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} PJSoftTech Pvt. Ltd.</span>
        <span className="footer-note">Designed for secure member operations</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}

export default Footer;
