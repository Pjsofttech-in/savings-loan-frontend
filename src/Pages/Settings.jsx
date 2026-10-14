// src/Pages/Settings.jsx
import { useEffect, useState } from "react";
import {
  getRegistrationSettings,
  saveRegistrationSettings,
} from "../services/settingsService";
import { fetchMembers } from "../services/memberService";

const catalogs = [
  { key: "memberTypes", title: "Member Types", singular: "Member Type", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0M19 8v6m3-3h-6" },
  { key: "years", title: "Membership Years", singular: "Membership Year", icon: "M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" },
  { key: "shareTypes", title: "Share Types", singular: "Share Type", icon: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5" },
  { key: "fees", title: "Fee Settings", singular: "Fee Setting", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { key: "bankAccount", title: "Bank Account", singular: "Bank Account", icon: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11" },
  { key: "members", title: "Members", singular: "Member", icon: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3a4 4 0 0 1 0 7m2 2a4 4 0 0 1 2 4" },
];

export default function Settings() {
  const [settings, setSettings] = useState(getRegistrationSettings);
  const [activeKey, setActiveKey] = useState(catalogs[0].key);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [newOption, setNewOption] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Fee settings local state for editing
  const [feeForm, setFeeForm] = useState({
    amount: settings.amount || 500,
    monthlyFee: settings.monthlyFee || 1000,
  });

  // Bank Account settings local state for editing
  const [bankForm, setBankForm] = useState(settings.bankAccount || {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountHolderName: "",
    accountType: "Current Account",
  });

  const activeCatalog = catalogs.find(({ key }) => key === activeKey);
  const isMemberList = activeKey === "members";
  const isFeeSettings = activeKey === "fees";
  const isBankAccount = activeKey === "bankAccount";
  
  // Safe options fallback for arrays
  const options = isMemberList ? members : (!isFeeSettings && !isBankAccount && Array.isArray(settings[activeKey])) ? settings[activeKey] : [];
  
  const filteredOptions = isMemberList
    ? members.filter((member) =>
        [member.id, member.fullName, member.email, member.mobile]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      )
    : (!isFeeSettings && !isBankAccount && Array.isArray(options))
    ? options.filter((option) =>
        option.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
      )
    : [];

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch((error) => setMessage(error.message))
      .finally(() => setIsLoadingMembers(false));
  }, []);

  const updateCatalog = (key, nextOptions) => {
    try {
      const nextSettings = saveRegistrationSettings({ ...settings, [key]: nextOptions });
      setSettings(nextSettings);
      setMessage("Settings saved successfully.");
    } catch {
      setMessage("Could not save settings in this browser.");
    }
  };

  const handleFeeSubmit = (e) => {
    e.preventDefault();
    try {
      const nextSettings = saveRegistrationSettings({
        ...settings,
        amount: Number(feeForm.amount),
        monthlyFee: Number(feeForm.monthlyFee),
      });
      setSettings(nextSettings);
      setMessage("Fee settings updated successfully. Live on registration form.");
    } catch {
      setMessage("Could not save fee settings.");
    }
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    try {
      const nextSettings = saveRegistrationSettings({
        ...settings,
        bankAccount: bankForm,
      });
      setSettings(nextSettings);
      setMessage("Bank account configuration updated successfully.");
    } catch {
      setMessage("Could not save bank account details.");
    }
  };

  const addOption = (event) => {
    event.preventDefault();
    const value = newOption.trim();
    if (!value) return;
    if (options.some((option) => option.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setMessage("That option already exists.");
      return;
    }
    updateCatalog(activeKey, [...options, value]);
    setNewOption("");
    setIsAdding(false);
    setSearch("");
  };

  const removeOption = (option) => {
    updateCatalog(activeKey, options.filter((item) => item !== option));
  };

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Settings</h1>
      </header>

      <div className={`settings-workspace ${menuExpanded ? "settings-menu-expanded" : ""}`}>
        <aside className="settings-category-menu" aria-label="Settings categories">
          <button
            type="button"
            className="settings-category-toggle"
            aria-label={menuExpanded ? "Collapse settings menu" : "Expand settings menu"}
            aria-expanded={menuExpanded}
            onClick={() => setMenuExpanded((expanded) => !expanded)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="settings-category-label">Settings menu</span>
          </button>
          {catalogs.map(({ key, title, icon }) => (
            <button
              key={key}
              type="button"
              className={`settings-category-button ${activeKey === key ? "active" : ""}`}
              aria-current={activeKey === key ? "page" : undefined}
              aria-label={title}
              title={!menuExpanded ? title : undefined}
              onClick={() => {
                setActiveKey(key);
                setSearch("");
                setMessage("");
                setIsAdding(false);
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon} />
              </svg>
              <span className="settings-category-label">{title}</span>
            </button>
          ))}
        </aside>

        <section key={activeKey} className="settings-category-content rounded-lg border border-slate-200 bg-white p-4 sm:p-5" aria-label={activeCatalog.title}>
          
          {/* FEE SETTINGS FORM VIEW */}
          {isFeeSettings ? (
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-slate-800 mb-2">Configure Registration &amp; Monthly Fees</h3>
              <p className="text-xs text-slate-500 mb-6">These amounts will automatically reflect on the member registration form in real-time.</p>

              {message && <p className="mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200" role="status">{message}</p>}

              <form onSubmit={handleFeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    One-Time Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Monthly Contribution / Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={feeForm.monthlyFee}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, monthlyFee: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-lg bg-[#1677d2] hover:bg-[#1269bd] text-white text-sm font-bold shadow-sm transition cursor-pointer"
                  >
                    Save Fee Settings
                  </button>
                </div>
              </form>
            </div>
          ) : isBankAccount ? (
            /* BANK ACCOUNT SETTINGS FORM VIEW */
            <div className="max-w-3xl">
              <h3 className="text-base font-bold text-slate-800 mb-2">Organization Bank Account Details</h3>
              <p className="text-xs text-slate-500 mb-6">Configure primary bank account information for fund inflow tracking and routing transparency.</p>

              {message && <p className="mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200" role="status">{message}</p>}

              <form onSubmit={handleBankSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Bank Name *</label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. State Bank of India"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Number *</label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="e.g. 12345678901"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">IFSC Code *</label>
                  <input
                    type="text"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    value={bankForm.branchName}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, branchName: e.target.value }))}
                    placeholder="e.g. Main Branch Pune"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                    placeholder="e.g. PJ SoftTech Group"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Type</label>
                  <select
                    value={bankForm.accountType}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, accountType: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                  </select>
                </div>

                <div className="col-span-full pt-2">
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-lg bg-[#1677d2] hover:bg-[#1269bd] text-white text-sm font-bold shadow-sm transition cursor-pointer"
                  >
                    Save Bank Account Details
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* CATALOGS / MEMBERS LIST VIEW */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <input
                  aria-label={`Search ${activeCatalog.title}`}
                  className="w-full h-11 px-4 sm:max-w-[480px] border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none transition focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search by ${activeCatalog.singular}`}
                />
                {!isMemberList && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewOption("");
                      setIsAdding((current) => !current);
                      setMessage("");
                    }}
                    className="h-11 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-sm font-bold shadow-sm transition"
                  >
                    {isAdding ? "Cancel" : `Create ${activeCatalog.singular}`}
                  </button>
                )}
                <span className="h-10 px-4 inline-flex items-center rounded-full border border-[#1677d2] text-[#1677d2] text-sm font-semibold">
                  Total: {options.length}
                </span>
              </div>

              {isAdding && !isMemberList && (
                <form onSubmit={addOption} className="flex flex-col sm:flex-row gap-3 mb-5">
                  <input
                    autoFocus
                    aria-label={`New ${activeCatalog.singular}`}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none transition focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                    value={newOption}
                    onChange={(event) => setNewOption(event.target.value)}
                    placeholder={`Enter ${activeCatalog.singular.toLocaleLowerCase()}`}
                    required
                  />
                  <button type="submit" className="h-11 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-sm font-bold transition">
                    Save
                  </button>
                </form>
              )}

              {message && <p className="mb-4 text-sm text-slate-700" role="status">{message}</p>}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[560px]">
                  <div className={`grid ${isMemberList ? "grid-cols-[90px_minmax(180px,1fr)_minmax(180px,1fr)_150px]" : "grid-cols-[110px_minmax(0,1fr)_180px]"} items-center bg-[#6495ed] text-white text-sm font-bold text-center`}>
                    <div className="px-4 py-3 border-r border-white/70">{isMemberList ? "User ID" : "ID"}</div>
                    <div className="px-4 py-3 border-r border-white/70">{isMemberList ? "Member Name" : activeCatalog.singular}</div>
                    {isMemberList ? (
                      <>
                        <div className="px-4 py-3 border-r border-white/70">Email</div>
                        <div className="px-4 py-3">Mobile</div>
                      </>
                    ) : <div className="px-4 py-3">Actions</div>}
                  </div>
                  {filteredOptions.map((option, index) => (
                    <div
                      key={isMemberList ? option.id : option}
                      className={`grid ${isMemberList ? "grid-cols-[90px_minmax(180px,1fr)_minmax(180px,1fr)_150px]" : "grid-cols-[110px_minmax(0,1fr)_180px]"} min-h-[62px] items-center text-center text-sm text-slate-900 ${index % 2 === 0 ? "bg-[#f7f7f7]" : "bg-white"}`}
                    >
                      {isMemberList ? (
                        <>
                          <div className="px-4 py-3 font-semibold">{option.id}</div>
                          <div className="px-4 py-3">{option.fullName || "-"}</div>
                          <div className="px-4 py-3">{option.email || "-"}</div>
                          <div className="px-4 py-3">{option.mobile || "-"}</div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-3">{index + 1}</div>
                          <div className="px-4 py-3">{option}</div>
                          <div className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeOption(option)}
                              className="min-w-[96px] h-10 rounded-md bg-[#dc2f2f] hover:bg-[#c92525] text-white font-semibold shadow-sm transition"
                              aria-label={`Delete ${option}`}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {!filteredOptions.length && !isFeeSettings && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 bg-white">
                      {isLoadingMembers && isMemberList ? "Loading members..." : search ? "No matching records." : isMemberList ? "No members found." : "No options configured."}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}