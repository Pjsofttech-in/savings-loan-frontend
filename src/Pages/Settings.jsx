import { useEffect, useState } from "react";
import {
  getRegistrationSettings,
  saveRegistrationSettings,
} from "../services/settingsService";
import { fetchMembers } from "../services/memberService";

const catalogs = [
  { key: "memberTypes", title: "Member Types", singular: "Member Type" },
  { key: "years", title: "Membership Years", singular: "Membership Year" },
  { key: "shareTypes", title: "Share Types", singular: "Share Type" },
  { key: "members", title: "Members", singular: "Member" },
];

export default function Settings() {
  const [settings, setSettings] = useState(getRegistrationSettings);
  const [activeKey, setActiveKey] = useState(catalogs[0].key);
  const [search, setSearch] = useState("");
  const [newOption, setNewOption] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const activeCatalog = catalogs.find(({ key }) => key === activeKey);
  const isMemberList = activeKey === "members";
  const options = isMemberList ? members : settings[activeKey];
  const filteredOptions = isMemberList
    ? members.filter((member) =>
        [member.id, member.fullName, member.email, member.mobile]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      )
    : options.filter((option) =>
        option.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
      );

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
      setMessage("Settings saved.");
    } catch {
      setMessage("Could not save settings in this browser.");
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Settings categories">
          {catalogs.map(({ key, title }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeKey === key}
              onClick={() => {
                setActiveKey(key);
                setSearch("");
                setMessage("");
                setIsAdding(false);
              }}
              className={`px-4 py-2 rounded-md border text-sm font-semibold transition ${
                activeKey === key
                  ? "border-[#1677d2] bg-[#1677d2] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {title}
            </button>
          ))}
        </div>

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
              className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm outline-none focus:border-[#1677d2] focus:ring-1 focus:ring-[#1677d2]"
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
            {!filteredOptions.length && (
              <div className="px-4 py-8 text-center text-sm text-slate-500 bg-white">
                {isLoadingMembers && isMemberList ? "Loading members..." : search ? "No matching records." : isMemberList ? "No members found." : "No options configured."}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}