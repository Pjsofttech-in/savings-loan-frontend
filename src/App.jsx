// src/App.jsx
import { useState } from "react";
import "./App.css";
import "./banking.css";
import Navbar from "./Components/navbar";
import Dashboard from "./Components/Dashboard";
import RegistrationForm from "./Pages/registration/RegistrationForm";
import RegistrationDashboard from "./Pages/registration/RegistrationDashboard";
import SharesApplicationForm from "./Pages/shares/SharesApplicationForm";
import SharesDashboard from "./Pages/shares/SharesDashboard";
import SharesList from "./Pages/registration/SharesList";
import MemberList from "./Components/MemberList";
import AddMember from "./Components/AddMember";

// Monthly Savings Pages
import MonthlySavingForm from "./Pages/Savings/MonthlySavingForm";
import MonthlySavingDashboard from "./Pages/Savings/MonthlySavingDashboard";
import MonthlySavingList from "./Pages/Savings/monthlySavinglist";

import Settings from "./Pages/Settings";

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [regSlide, setRegSlide] = useState("dashboard");
  const [sharesSlide, setSharesSlide] = useState("dashboard"); // "dashboard" | "form" | "list"
  const [savingsSlide, setSavingsSlide] = useState("dashboard"); // "dashboard" | "form" | "list"

  return (
    <div className="app-shell min-h-screen bg-[#eef2ef]">
      <Navbar 
        activeView={activeView} 
        onNavigate={(view) => {
          setActiveView(view);
          if (view === "registration") setRegSlide("dashboard");
          if (view === "shares") setSharesSlide("dashboard");
          if (view === "savings") setSavingsSlide("dashboard");
        }} 
      />

      <div className="app-content min-h-[calc(100vh-72px)]">
        
        {/* Main System Dashboard */}
        {activeView === "dashboard" && (
          <Dashboard
            onStartRegistration={() => { setActiveView("registration"); setRegSlide("form"); }}
            onStartSharesApplication={() => { setActiveView("shares"); setSharesSlide("form"); }}
            onShowUserList={() => { setActiveView("savings"); setSavingsSlide("list"); }}
          />
        )}

        {/* Member Registration Sections */}
        {activeView === "registration" && (
          <div className="flex flex-col min-h-full">
            <div className="workflow-header bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-[76px] z-20">
              <div className="workflow-tabs flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setRegSlide("dashboard")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "dashboard" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
                <button onClick={() => setRegSlide("form")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "form" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>2. Registration Form</button>
                <button onClick={() => setRegSlide("list")} className={`workflow-tab px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${regSlide === "list" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>3. Members</button>
              </div>
            </div>
            <div className="workflow-content max-w-[1400px] mx-auto w-full flex-1 p-6">
              {regSlide === "dashboard" && <RegistrationDashboard onStartRegistration={() => setRegSlide("form")} onShowList={() => setRegSlide("list")} />}
              {regSlide === "form" && <RegistrationForm />}
              {regSlide === "list" && <MemberList />}
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
              {sharesSlide === "list" && <SharesList />}
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

        {/* Other system routes */}
        {activeView === "add-member" && <AddMember />}
        {activeView === "settings" && <Settings />}

      </div>
    </div>
  );
}

export default App;