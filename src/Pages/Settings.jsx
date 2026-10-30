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
  { key: "bankAccount", title: "Bank Account", singular: "Bank Account", icon: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11" },
  { key: "members", title: "Members", singular: "Member", icon: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3a4 4 0 0 1 0 7m2 2a4 4 0 0 1 2 4" },
];

const INDIAN_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda (BOB)",
  "Canara Bank",
  "Union Bank of India",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "IDBI Bank",
  "Bank of India",
  "Indian Overseas Bank",
  "Central Bank of India",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
  "Bandhan Bank",
  "AU Small Finance Bank",
  "Paytm Payments Bank",
  "Fino Payments Bank",
  "Other Bank"
];

export default function Settings() {
  const [settings, setSettings] = useState(getRegistrationSettings);
  const [activeKey, setActiveKey] = useState(catalogs[0].key);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Member Types with Fee structured state
  const [memberTypesWithFee, setMemberTypesWithFee] = useState(() => {
    if (settings.memberTypesWithFee && Array.isArray(settings.memberTypesWithFee)) {
      return settings.memberTypesWithFee;
    }
    const defaults = settings.memberTypes || ["General", "Lifetime", "Honorary", "Founder"];
    return defaults.map((name, idx) => ({
      id: idx + 1,
      name,
      regFee: settings.amount || 500,
      monthlyFee: settings.monthlyFee || 1000,
      yearlyFee: (settings.monthlyFee || 1000) * 12,
    }));
  });

  const [newTypeForm, setNewTypeForm] = useState({
    name: "",
    regFee: 500,
    monthlyFee: 1000,
    yearlyFee: 12000,
  });

  // Bank Account list state
  const [bankAccounts, setBankAccounts] = useState(() => {
    if (settings.bankAccounts && Array.isArray(settings.bankAccounts)) return settings.bankAccounts;
    if (settings.bankAccount) return [settings.bankAccount];
    return [];
  });

  const [bankForm, setBankForm] = useState({
    bankName: INDIAN_BANKS[0],
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountHolderName: "",
    accountType: "Current Account",
  });

  const activeCatalog = catalogs.find(({ key }) => key === activeKey);
  const isMemberList = activeKey === "members";
  const isBankAccount = activeKey === "bankAccount";
  const isMemberTypes = activeKey === "memberTypes";
  
  const options = isMemberList 
    ? members 
    : isMemberTypes
    ? memberTypesWithFee
    : (!isBankAccount && Array.isArray(settings[activeKey])) 
    ? settings[activeKey] 
    : [];
  
  const filteredOptions = isMemberList
    ? members.filter((member) =>
        [member.id, member.fullName, member.email, member.mobile]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      )
    : isMemberTypes
    ? memberTypesWithFee.filter((t) =>
        t.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
      )
    : (!isBankAccount && Array.isArray(options))
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

  const saveMemberTypesSettings = (updatedList) => {
    try {
      const plainNames = updatedList.map(t => t.name);
      const nextSettings = saveRegistrationSettings({
        ...settings,
        memberTypes: plainNames,
        memberTypesWithFee: updatedList,
      });
      setSettings(nextSettings);
      setMemberTypesWithFee(updatedList);
      setMessage("Member types & fee structure saved successfully.");
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch {
      setMessage("Could not save member types settings.");
    }
  };

  const handleMemberTypeFeeChange = (id, field, value) => {
    const updated = memberTypesWithFee.map(item => {
      if (item.id === id) {
        return { ...item, [field]: Number(value) || 0 };
      }
      return item;
    });
    saveMemberTypesSettings(updated);
  };

  const handleCreateMemberType = (e) => {
    e.preventDefault();
    const name = newTypeForm.name.trim();
    if (!name) return;
    if (memberTypesWithFee.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      setMessage("That member type already exists.");
      return;
    }
    const newItem = {
      id: Date.now(),
      name,
      regFee: Number(newTypeForm.regFee) || 500,
      monthlyFee: Number(newTypeForm.monthlyFee) || 1000,
      yearlyFee: Number(newTypeForm.yearlyFee) || 12000,
    };
    const updated = [...memberTypesWithFee, newItem];
    saveMemberTypesSettings(updated);
    setNewTypeForm({ name: "", regFee: 500, monthlyFee: 1000, yearlyFee: 12000 });
    setIsAdding(false);
    setSearch("");
  };

  const removeMemberType = (id) => {
    const updated = memberTypesWithFee.filter(t => t.id !== id);
    saveMemberTypesSettings(updated);
  };

  const updateCatalog = (key, nextOptions) => {
    try {
      const nextSettings = saveRegistrationSettings({ ...settings, [key]: nextOptions });
      setSettings(nextSettings);
      setMessage("Settings saved successfully.");
    } catch {
      setMessage("Could not save settings in this browser.");
    }
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    try {
      const updatedAccounts = [...bankAccounts, { ...bankForm, id: Date.now() }];
      const nextSettings = saveRegistrationSettings({
        ...settings,
        bankAccounts: updatedAccounts,
        bankAccount: updatedAccounts[0]
      });
      setSettings(nextSettings);
      setBankAccounts(updatedAccounts);
      setMessage("Bank account added successfully.");
      setIsAdding(false);
      setBankForm({
        bankName: INDIAN_BANKS[0],
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        accountHolderName: "",
        accountType: "Current Account",
      });
    } catch {
      setMessage("Could not save bank account details.");
    }
  };

  const removeBankAccount = (id) => {
    try {
      const updatedAccounts = bankAccounts.filter(acc => acc.id !== id);
      const nextSettings = saveRegistrationSettings({
        ...settings,
        bankAccounts: updatedAccounts,
        bankAccount: updatedAccounts[0] || null
      });
      setSettings(nextSettings);
      setBankAccounts(updatedAccounts);
      setMessage("Bank account deleted successfully.");
    } catch {
      setMessage("Could not delete bank account.");
    }
  };

  const addOption = (event) => {
    event.preventDefault();
    const value = newTypeForm.name.trim();
    if (!value) return;
    if (options.some((option) => option.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setMessage("That option already exists.");
      return;
    }
    updateCatalog(activeKey, [...options, value]);
    setNewTypeForm({ ...newTypeForm, name: "" });
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
          
          {isBankAccount ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#102a43] m-0">Manage Organization Bank Accounts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Add and manage multiple bank accounts for destination selection during registration and share allocation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding((current) => !current);
                    setMessage("");
                  }}
                  className="h-10 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {isAdding ? "Cancel" : "Create New Bank Account"}
                </button>
              </div>

              {message && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200" role="status">{message}</p>}

              {isAdding && (
                <form onSubmit={handleBankSubmit} className="p-5 bg-white border border-slate-300 rounded-xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Add a New Bank Account</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Bank Name *</label>
                      <select
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, bankName: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white font-bold text-slate-800 outline-none focus:border-[#1677d2]"
                        required
                      >
                        {INDIAN_BANKS.map((b, idx) => (
                          <option key={idx} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Account Number *</label>
                      <input
                        type="text"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="Enter A/c Number"
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:border-[#1677d2]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                        placeholder="Enter IFSC"
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:border-[#1677d2]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={bankForm.branchName}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, branchName: e.target.value }))}
                        placeholder="Branch Location"
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:border-[#1677d2]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Holder Name</label>
                      <input
                        type="text"
                        value={bankForm.accountHolderName}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                        placeholder="Account Holder Name"
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:border-[#1677d2]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Account Type</label>
                      <select
                        value={bankForm.accountType}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, accountType: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white font-bold text-slate-800 outline-none focus:border-[#1677d2]"
                      >
                        <option value="Current Account">Current Account</option>
                        <option value="Savings Account">Savings Account</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="h-9 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      Save Bank Account
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[650px]">
                  <div className="grid grid-cols-[70px_minmax(160px,1fr)_150px_140px_130px_110px] items-center bg-[#6495ed] text-white text-xs font-bold text-center">
                    <div className="px-3 py-3 border-r border-white/70">ID</div>
                    <div className="px-3 py-3 border-r border-white/70">Bank Name</div>
                    <div className="px-3 py-3 border-r border-white/70">Account Number</div>
                    <div className="px-3 py-3 border-r border-white/70">IFSC Code</div>
                    <div className="px-3 py-3 border-r border-white/70">Type</div>
                    <div className="px-3 py-3">Actions</div>
                  </div>

                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((acc, index) => (
                      <div
                        key={acc.id || index}
                        className={`grid grid-cols-[70px_minmax(160px,1fr)_150px_140px_130px_110px] min-h-[58px] items-center text-center text-xs text-slate-900 ${index % 2 === 0 ? "bg-[#f7f7f7]" : "bg-white"}`}
                      >
                        <div className="px-3 py-3 font-semibold">{index + 1}</div>
                        <div className="px-3 py-3 font-bold">{acc.bankName}</div>
                        <div className="px-3 py-3 font-mono">{acc.accountNumber}</div>
                        <div className="px-3 py-3 font-mono">{acc.ifscCode}</div>
                        <div className="px-3 py-3">{acc.accountType}</div>
                        <div className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeBankAccount(acc.id)}
                            className="w-20 h-8 rounded-md bg-[#dc2f2f] hover:bg-[#c92525] text-white font-semibold shadow-sm transition cursor-pointer text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-xs text-slate-500 bg-white">
                      No bank accounts configured yet. Click "Create New Bank Account" above to add one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isMemberTypes ? (
            /* SPECIAL MEMBER TYPES TABLE WITH REGISTRATION, MONTHLY & YEARLY FEES */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  aria-label="Search Member Types"
                  className="w-full h-11 px-4 sm:max-w-[420px] border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none transition focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by Member Type..."
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding((current) => !current);
                    setMessage("");
                  }}
                  className="h-11 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  {isAdding ? "Cancel" : "Create Member Type"}
                </button>
                <span className="h-10 px-4 inline-flex items-center rounded-full border border-[#1677d2] text-[#1677d2] text-sm font-semibold">
                  Total: {memberTypesWithFee.length}
                </span>
              </div>

              {message && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200" role="status">{message}</p>}

              {isAdding && (
                <form onSubmit={handleCreateMemberType} className="p-5 bg-white border border-slate-300 rounded-xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Add New Member Type & Fee Setup</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Type Name *</label>
                      <input
                        type="text"
                        value={newTypeForm.name}
                        onChange={(e) => setNewTypeForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. VIP Member"
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Reg. Fee (₹)</label>
                      <input
                        type="number"
                        value={newTypeForm.regFee}
                        onChange={(e) => setNewTypeForm(prev => ({ ...prev, regFee: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Monthly Fee (₹)</label>
                      <input
                        type="number"
                        value={newTypeForm.monthlyFee}
                        onChange={(e) => setNewTypeForm(prev => ({ ...prev, monthlyFee: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Yearly Fee (₹)</label>
                      <input
                        type="number"
                        value={newTypeForm.yearlyFee}
                        onChange={(e) => setNewTypeForm(prev => ({ ...prev, yearlyFee: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md bg-white text-slate-900 outline-none font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="h-9 px-5 rounded-md bg-[#1677d2] hover:bg-[#1269bd] text-white text-xs font-bold shadow-sm transition">
                      Save Member Type
                    </button>
                  </div>
                </form>
              )}

              {/* Member Types Fee Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[750px]">
                  <div className="grid grid-cols-[70px_minmax(160px,1fr)_160px_160px_160px_110px] items-center bg-[#6495ed] text-white text-xs font-bold text-center">
                    <div className="px-3 py-3 border-r border-white/70">ID</div>
                    <div className="px-3 py-3 border-r border-white/70">Member Type</div>
                    <div className="px-3 py-3 border-r border-white/70">Registration Fee (₹)</div>
                    <div className="px-3 py-3 border-r border-white/70">Monthly Fee (₹)</div>
                    <div className="px-3 py-3 border-r border-white/70">Yearly Fee (₹)</div>
                    <div className="px-3 py-3">Actions</div>
                  </div>

                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((item, index) => (
                      <div
                        key={item.id || index}
                        className={`grid grid-cols-[70px_minmax(160px,1fr)_160px_160px_160px_110px] min-h-[60px] items-center text-center text-xs text-slate-900 ${index % 2 === 0 ? "bg-[#f7f7f7]" : "bg-white"}`}
                      >
                        <div className="px-3 py-3 font-semibold">{index + 1}</div>
                        <div className="px-3 py-3 font-extrabold text-sm text-[#102a43]">{item.name}</div>
                        
                        <div className="px-3 py-2">
                          <input
                            type="number"
                            value={item.regFee}
                            onChange={(e) => handleMemberTypeFeeChange(item.id, 'regFee', e.target.value)}
                            className="w-28 h-8 px-2 border border-slate-300 rounded text-center text-xs font-bold outline-none focus:border-[#1677d2] bg-white shadow-inner"
                          />
                        </div>

                        <div className="px-3 py-2">
                          <input
                            type="number"
                            value={item.monthlyFee}
                            onChange={(e) => handleMemberTypeFeeChange(item.id, 'monthlyFee', e.target.value)}
                            className="w-28 h-8 px-2 border border-slate-300 rounded text-center text-xs font-bold outline-none focus:border-[#1677d2] bg-white shadow-inner"
                          />
                        </div>

                        <div className="px-3 py-2">
                          <input
                            type="number"
                            value={item.yearlyFee}
                            onChange={(e) => handleMemberTypeFeeChange(item.id, 'yearlyFee', e.target.value)}
                            className="w-28 h-8 px-2 border border-slate-300 rounded text-center text-xs font-bold outline-none focus:border-[#1677d2] bg-white shadow-inner"
                          />
                        </div>

                        <div className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeMemberType(item.id)}
                            className="w-20 h-8 rounded-md bg-[#dc2f2f] hover:bg-[#c92525] text-white font-semibold shadow-sm transition cursor-pointer text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-xs text-slate-500 bg-white">
                      No member types found matching your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
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
                      setNewTypeForm({ ...newTypeForm, name: "" });
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
                    value={newTypeForm.name}
                    onChange={(event) => setNewTypeForm({ ...newTypeForm, name: event.target.value })}
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
                  {!filteredOptions.length && (
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
