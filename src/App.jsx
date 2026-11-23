// src/App.jsx
import { useEffect, useState } from "react";
import { toSentenceCase } from "./utils/formHelpers";
import "./App.css";
import "./banking.css";
import Navbar from "./Components/navbar";
import Dashboard from "./Components/Dashboard";
import RegistrationForm from "./Pages/registration/RegistrationForm";
import RegistrationDashboard from "./Pages/registration/RegistrationDashboard";
import List from "./Pages/registration/List";
import SharesApplicationForm from "./Pages/shares/SharesApplicationForm";
import SharesDashboard from "./Pages/shares/SharesDashboard";
import SharesList from "./Pages/shares/SharesList"; // Corrected path to shares folder

import AddMember from "./Components/AddMember";

// Monthly Savings Pages
import MonthlySavingForm from "./Pages/Savings/MonthlySavingForm";
import MonthlySavingDashboard from "./Pages/Savings/MonthlySavingDashboard";
import MonthlySavingList from "./Pages/Savings/monthlySavinglist";
import LoanDashboard from "./Pages/Loans/LoanDashboard";
import LoanForm from "./Pages/Loans/LoanForm";
import LoanApplicants from "./Pages/Loans/LoanApplicants";
import LoanList from "./Pages/Loans/LoanList";

import Settings from "./Pages/Settings";

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [regSlide, setRegSlide] = useState("dashboard");
  const [sharesSlide, setSharesSlide] = useState("dashboard"); // "dashboard" | "form" | "list"
  const [savingsSlide, setSavingsSlide] = useState("dashboard"); // "dashboard" | "form" | "list"
  const [loanSlide, setLoanSlide] = useState("dashboard");
  
  // Member Edit State
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    const formatTextInput = (event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
      if (field instanceof HTMLInputElement && !["text", "search"].includes(field.type)) return;

      const formattedValue = toSentenceCase(field.value);
      if (formattedValue !== field.value) {
        const valueSetter = Object.getOwnPropertyDescriptor(field.constructor.prototype, "value")?.set;
        valueSetter?.call(field, formattedValue);
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    document.addEventListener("input", formatTextInput, true);
    return () => document.removeEventListener("input", formatTextInput, true);
  }, []);

  return (
    <div className="app-shell min-h-screen bg-[#eef2ef]">
      <Navbar 
        activeView={activeView} 
        onNavigate={(view) => {
          setActiveView(view);
          if (view === "registration") {
            setRegSlide("dashboard");
            setEditingMember(null);
          }
          if (view === "shares") setSharesSlide("dashboard");
          if (view === "savings") setSavingsSlide("dashboard");
          if (view === "loans") setLoanSlide("dashboard");
        }} 
      />

      <div className="app-content min-h-[calc(100vh-72px)]">
        
        {/* Main System Dashboard */}
        {activeView === "dashboard" && (
          <Dashboard
            onStartRegistration={() => { setActiveView("registration"); setRegSlide("form"); setEditingMember(null); }}
            onStartSharesApplication={() => { setActiveView("shares"); setSharesSlide("form"); }}
            onShowUserList={() => { setActiveView("savings"); setSavingsSlide("list"); }}
          />
        )}

        {/* Member Registration Sections */}
        {activeView === "registration" && (
          <div className="flex flex-col min-h-full">
            <div className="workflow-header bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-[76px] z-20">
              <div className="workflow-tabs flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => { setRegSlide("dashboard"); setEditingMember(null); }} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "dashboard" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
                <button onClick={() => setRegSlide("form")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "form" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>2. Registration Form</button>
                <button onClick={() => { setRegSlide("financial"); setEditingMember(null); }} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "financial" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>3. Financial Records</button>
                <button onClick={() => { setRegSlide("list"); setEditingMember(null); }} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "list" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>4. Members</button>
              </div>
            </div>
            <div className="workflow-content max-w-[1400px] mx-auto w-full flex-1 p-6">
              {regSlide === "dashboard" && <RegistrationDashboard onStartRegistration={() => { setRegSlide("form"); setEditingMember(null); }} onShowList={() => setRegSlide("list")} />}
              {regSlide === "form" && (
                <RegistrationForm 
                  editingMember={editingMember} 
                  onCancelEdit={() => { setEditingMember(null); setRegSlide("list"); }}
                  onSuccess={() => { setEditingMember(null); setRegSlide("list"); }}
                />
              )}
              {regSlide === "financial" && (
                <List
                  view="financial"
                  onEditMember={(member) => {
                    setEditingMember(member);
                    setRegSlide("form");
                  }}
                />
              )}
              {regSlide === "list" && (
                <List 
                  onEditMember={(member) => {
                    setEditingMember(member);
                    setRegSlide("form");
                  }} 
                />
              )}
            </div>
          </div>
        )}

        {/* Shares Application Sections */}
        {activeView === "shares" && (
          <div className="flex flex-col min-h-full">
            <div className="workflow-header bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-[76px] z-20">
              <div className="workflow-tabs flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setSharesSlide("dashboard")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sharesSlide === "dashboard" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
                <button onClick={() => setSharesSlide("form")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sharesSlide === "form" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>2. Shares Form</button>
                <button onClick={() => setSharesSlide("list")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sharesSlide === "list" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>3. Shares Records</button>
              </div>
            </div>
            <div className="workflow-content max-w-[1400px] mx-auto w-full flex-1 p-6">
              {sharesSlide === "dashboard" && <SharesDashboard onStartShares={() => setSharesSlide("form")} onShowList={() => setSharesSlide("list")} />}
              {sharesSlide === "form" && <SharesApplicationForm />}
              {sharesSlide === "list" && <SharesList onStartShares={() => setSharesSlide("form")} />}
            </div>
          </div>
        )}

        {/* Monthly Savings Sections */}
        {activeView === "savings" && (
          <div className="flex flex-col min-h-full">
            <div className="workflow-header bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-[76px] z-20">
              <div className="workflow-tabs flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setSavingsSlide("dashboard")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${savingsSlide === "dashboard" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
                <button onClick={() => setSavingsSlide("form")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${savingsSlide === "form" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>2. Monthly Saving Form</button>
                <button onClick={() => setSavingsSlide("list")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${savingsSlide === "list" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>3. Saving Records Table</button>
              </div>
            </div>
            <div className="workflow-content max-w-[1400px] mx-auto w-full flex-1 p-6">
              {savingsSlide === "dashboard" && (
                <MonthlySavingDashboard 
                  onStartSaving={() => setSavingsSlide("form")} 
                  onShowList={() => setSavingsSlide("list")} 
                />
              )}
              {savingsSlide === "form" && <MonthlySavingForm />}
              {savingsSlide === "list" && (
                <MonthlySavingList 
                  onStartSaving={() => setSavingsSlide("form")} 
                />
              )}
            </div>
          </div>
        )}

        {/* Loan Management */}
        {activeView === "loans" && (
          <div className="flex flex-col min-h-full">
            <div className="workflow-header bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-[76px] z-20">
              <div className="workflow-tabs flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setLoanSlide("dashboard")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loanSlide === "dashboard" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
                <button onClick={() => setLoanSlide("form")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loanSlide === "form" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Loan Form</button>
                <button onClick={() => setLoanSlide("applicants")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loanSlide === "applicants" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Loan Applicants</button>
                <button onClick={() => setLoanSlide("list")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loanSlide === "list" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Loan Records</button>
              </div>
            </div>
            <div className="workflow-content max-w-[1400px] mx-auto w-full flex-1 p-6">
              {loanSlide === "dashboard" && (
                <LoanDashboard
                  onStartLoan={() => setLoanSlide("form")}
                  onShowApplicants={() => setLoanSlide("applicants")}
                  onShowList={() => setLoanSlide("list")}
                />
              )}
              {loanSlide === "applicants" && <LoanApplicants />}
              {loanSlide === "form" && <LoanForm onSuccess={() => setLoanSlide("applicants")} />}
              {loanSlide === "list" && <LoanList />}
            </div>
          </div>
        )}

        {/* Other system routes */}
        {activeView === "add-member" && <AddMember />}
        {activeView === "settings" && <Settings />}

      </div>
    </div>
  );
}

export default App;
