// src/Components/MemberList.jsx
import { useEffect, useMemo, useState } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import { fetchMemberById, fetchMembers } from "../services/memberService";
import { fetchShareAllocations } from "../services/shareService";
import MemberAvatar from "./MemberAvatar";

const initialFilters = { memberType: "", year: "", city: "", status: "" };

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0 border-b border-slate-100 pb-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not provided"}</dd>
    </div>
  );
}

function MemberDetailsModal({ member, allocations, shareLoadError, loading, error, onClose }) {
  const [activeSection, setActiveSection] = useState("personal");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const memberShares = allocations
    .filter((allocation) => String(allocation.memberId) === String(member?.id))
    .sort((left, right) => String(right.applicationDate || "").localeCompare(String(left.applicationDate || "")));
  const totalShares = memberShares.reduce((total, allocation) => total + (Number(allocation.numberOfShares) || 0), 0);
  const totalShareValue = memberShares.reduce((total, allocation) => total + (Number(allocation.paymentAmount) || 0), 0);
  const status = member?.status || "Unknown";
  const normalizedStatus = status.toLocaleLowerCase();
  const statusClass = normalizedStatus === "active"
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : ["suspended", "terminated", "inactive", "disactive"].includes(normalizedStatus)
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-amber-50 text-amber-800 border-amber-200";
  const profileSections = [
    { id: "personal", label: "Personal information" },
    { id: "address", label: "Address information" },
    { id: "nominee", label: "Nominee details" },
    { id: "membership", label: "Membership" },
    { id: "documents", label: "Documents" },
    { id: "shares", label: "Share history" },
    { id: "loans", label: "Loan records" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-title"
        className="member-profile-modal flex max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <aside className="member-profile-sidebar flex shrink-0 flex-col text-white">
          <div className="member-profile-identity">
            <button
              type="button"
              onClick={onClose}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white cursor-pointer"
            >
              <span aria-hidden="true">←</span> Back
            </button>
            <MemberAvatar
              name={member?.fullName}
              className="member-profile-avatar overflow-hidden"
            />
            <h2 id="member-profile-title" className="mt-3 break-words text-center text-lg font-bold">
              {member?.fullName || "Member details"}
            </h2>
            <p className="mt-1 break-all text-center text-sm text-white/85">{member?.email || "Email not provided"}</p>
            <p className="mt-2 text-center font-mono text-xs text-white/75">Member ID: {member?.id || "—"}</p>
            <span className={`mx-auto mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}>
              {status}
            </span>
          </div>

          <nav className="member-profile-nav" aria-label="Member profile sections">
            {profileSections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                aria-current={activeSection === section.id ? "page" : undefined}
                onClick={() => setActiveSection(section.id)}
                className={`member-profile-nav-item ${activeSection === section.id ? "active" : ""}`}
              >
                <span className="member-profile-nav-number">{index + 1}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="member-profile-main min-w-0 flex-1 overflow-y-auto">
          <header className="member-profile-topbar flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Member profile</span>
              <p className="mt-1 text-sm text-slate-600">{member?.memberType || "Member"} · {member?.membershipYear || "Membership year not provided"}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close member details"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            >
              ×
            </button>
          </header>

          <div className="member-profile-content">
            {loading && <p className="py-12 text-center text-sm text-slate-500">Loading member details...</p>}
            {error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            {member && (
              <>
                {activeSection === "personal" && (
                  <section>
                    <h3 className="member-profile-section-title">Personal information</h3>
                    <dl className="member-profile-fields">
                      <DetailItem label="Full name" value={member.fullName} />
                      <DetailItem label="Father / spouse name" value={member.fatherName} />
                      <DetailItem label="Date of birth" value={formatDate(member.birthDate)} />
                      <DetailItem label="Gender" value={member.gender} />
                      <DetailItem label="Occupation" value={member.occupation} />
                      <DetailItem label="Mobile" value={member.mobile} />
                      <DetailItem label="Email" value={member.email} />
                    </dl>
                  </section>
                )}

                {activeSection === "address" && (
                  <section>
                    <h3 className="member-profile-section-title">Address information</h3>
                    <dl className="member-profile-fields">
                      <DetailItem label="Address" value={member.address} />
                      <DetailItem label="City" value={member.city} />
                    </dl>
                  </section>
                )}

                {activeSection === "nominee" && (
                  <section>
                    <h3 className="member-profile-section-title">Nominee details</h3>
                    <dl className="member-profile-fields">
                      <DetailItem label="Nominee" value={member.nomineeName} />
                      <DetailItem label="Relationship" value={member.nomineeRelationship} />
                      <DetailItem label="Nominee mobile" value={member.nomineeMobile} />
                    </dl>
                  </section>
                )}

                {activeSection === "membership" && (
                  <section>
                    <h3 className="member-profile-section-title">Membership</h3>
                    <dl className="member-profile-fields">
                      <DetailItem label="Member type" value={member.memberType} />
                      <DetailItem label="Membership year" value={member.membershipYear} />
                      <DetailItem label="Joined" value={formatDate(member.joiningDate)} />
                      <DetailItem label="Account status" value={status} />
                      <DetailItem label="Registration payment reference" value={member.paymentId} />
                    </dl>
                  </section>
                )}

                {activeSection === "documents" && (
                  <section>
                    <h3 className="member-profile-section-title">Submitted document</h3>
                    <dl className="member-profile-fields">
                      <DetailItem label="ID proof type" value={member.documentType} />
                    </dl>
                    <p className="member-document-note">
                      The registration record stores the document type. The uploaded file is not available to view in this profile.
                    </p>
                  </section>
                )}

                {activeSection === "shares" && (
                  <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="member-profile-section-title !mb-0">Share history</h3>
                      <span className="text-sm font-semibold text-slate-600">
                        {totalShares} shares · {formatIndianCurrency(totalShareValue)}
                      </span>
                    </div>
                    {shareLoadError ? (
                      <p role="status" className="text-sm text-amber-800">Share history unavailable: {shareLoadError}</p>
                    ) : memberShares.length ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-[620px] w-full text-left text-sm">
                          <thead>
                            <tr>
                              <th>Applied</th>
                              <th>Share type</th>
                              <th>Units</th>
                              <th>Payment</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberShares.map((allocation) => (
                              <tr key={allocation.id}>
                                <td>{formatDate(allocation.applicationDate)}</td>
                                <td>{allocation.shareType || "-"}</td>
                                <td>{allocation.numberOfShares}</td>
                                <td>{formatIndianCurrency(allocation.paymentAmount)}</td>
                                <td>{allocation.paymentStatus || "Unknown"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No share allocations are recorded for this member.</p>
                    )}
                  </section>
                )}

                {activeSection === "loans" && (
                  <section>
                    <h3 className="member-profile-section-title">Loan records</h3>
                    <p className="text-sm text-slate-600">Loan account history is not stored in the current member records.</p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [shareLoadError, setShareLoadError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadData = () => {
    Promise.all([
      fetchMembers().then((data) => setMembers(data)).catch((error) => setLoadError(error.message)),
      fetchShareAllocations().then((data) => setAllocations(data)).catch((error) => setShareLoadError(error.message)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("dataUpdated", loadData);
    return () => window.removeEventListener("dataUpdated", loadData);
  }, []);

  const memberTypes = [...new Set(members.map((member) => member.memberType).filter(Boolean))].sort();
  const years = [...new Set(members.map((member) => member.membershipYear).filter(Boolean))].sort();
  const cities = [...new Set(members.map((member) => member.city).filter(Boolean))].sort();
  const statuses = [...new Set(members.map((member) => member.status).filter(Boolean))].sort();

  const shareAmounts = useMemo(() => {
    const totals = new Map();
    allocations.forEach((allocation) => {
      const memberId = String(allocation.memberId);
      totals.set(memberId, (totals.get(memberId) || 0) + (Number(allocation.paymentAmount) || 0));
    });
    return totals;
  }, [allocations]);

  const filteredMembers = members.filter((member) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [member.id, member.fullName, member.mobile, member.email]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(query));
    return matchesSearch
      && (!filters.memberType || member.memberType === filters.memberType)
      && (!filters.year || member.membershipYear === filters.year)
      && (!filters.city || member.city === filters.city)
      && (!filters.status || member.status === filters.status);
  });

  const clearFilters = () => {
    setSearch("");
    setFilters(initialFilters);
  };

  const openMemberDetails = async (memberId) => {
    setSelectedMemberId(memberId);
    setSelectedMember(null);
    setDetailError("");
    setLoadingDetails(true);
    try {
      setSelectedMember(await fetchMemberById(memberId));
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
    <main className="max-w-[1300px] mx-auto px-4 pb-6 pt-0 lg:px-6 lg:pb-8 lg:pt-0 font-sans text-xs">
      <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          <input
            aria-label="Search members"
            className="h-9 px-3 border border-slate-300 rounded-md text-xs outline-none focus:border-teal-600 sm:col-span-1"
            placeholder="Search ID, name, mobile..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Member Types"
            className="h-9 px-2 border border-slate-300 rounded-md bg-white text-xs text-slate-700 outline-none focus:border-teal-600 font-bold"
            value={filters.memberType}
            onChange={(event) => setFilters((current) => ({ ...current, memberType: event.target.value }))}
          >
            <option value="">Member Types</option>
            {memberTypes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select
            aria-label="Joining Years"
            className="h-9 px-2 border border-slate-300 rounded-md bg-white text-xs text-slate-700 outline-none focus:border-teal-600 font-bold"
            value={filters.year}
            onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
          >
            <option value="">Joining Years</option>
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select
            aria-label="Cities"
            className="h-9 px-2 border border-slate-300 rounded-md bg-white text-xs text-slate-700 outline-none focus:border-teal-600 font-bold"
            value={filters.city}
            onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
          >
            <option value="">Cities</option>
            {cities.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select
            aria-label="Statuses"
            className="h-9 px-2 border border-slate-300 rounded-md bg-white text-xs text-slate-700 outline-none focus:border-teal-600 font-bold"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Statuses</option>
            {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {(search || Object.values(filters).some(Boolean)) && (
          <button type="button" onClick={clearFilters} className="mb-3 text-[11px] font-semibold text-teal-800 hover:text-teal-950 cursor-pointer">
            Clear filters
          </button>
        )}
        {loadError && <p className="mb-4 text-xs text-red-700" role="alert">{loadError}</p>}
        {shareLoadError && <p className="mb-4 text-xs text-amber-800" role="status">Share totals unavailable: {shareLoadError}</p>}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#6495ed] text-white font-bold text-center">
                <th className="p-2 border-r border-blue-500 w-20">Member ID</th>
                <th className="p-2 border-r border-blue-500 w-16">Photo</th>
                <th className="p-2 border-r border-blue-500">Name</th>
                <th className="p-2 border-r border-blue-500">Mobile No.</th>
                <th className="p-2 border-r border-blue-500">Email</th>
                <th className="p-2 border-r border-blue-500">Member Type</th>
                <th className="p-2 border-r border-blue-500">Member Fee</th>
                <th className="p-2 border-r border-blue-500">City</th>
                <th className="p-2 border-r border-blue-500">Joining Date</th>
                <th className="p-2 text-right">Share Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-center">
              {filteredMembers.map((member, index) => (
                <tr key={member.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-[#f7f7f7]" : "bg-white"}`}>
                  <td className="p-2 font-mono font-semibold text-slate-700">
                    <button type="button" onClick={() => openMemberDetails(member.id)} className="text-teal-800 hover:underline cursor-pointer">
                      {member.id}
                    </button>
                  </td>
                  <td className="p-2">
                    <MemberAvatar
                      name={member.fullName}
                      className="h-7 w-7 rounded-full mx-auto"
                    />
                  </td>
                  <td className="p-2 font-bold text-slate-900 text-left">
                    <button type="button" onClick={() => openMemberDetails(member.id)} className="hover:text-teal-800 hover:underline cursor-pointer">
                      {member.fullName || "-"}
                    </button>
                  </td>
                  <td className="p-2 text-slate-600">{member.mobile || "-"}</td>
                  <td className="p-2 text-slate-600">{member.email || "-"}</td>
                  <td className="p-2 text-slate-600">{member.memberType || "-"}</td>
                  <td className="p-2 font-bold text-teal-700">₹{member.registrationFee || member.memberFee || 500}</td>
                  <td className="p-2 text-slate-600">{member.city || "-"}</td>
                  <td className="p-2 text-slate-600">{formatDate(member.joiningDate)}</td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {shareLoadError ? "-" : formatIndianCurrency(shareAmounts.get(String(member.id)) || 0)}
                  </td>
                </tr>
              ))}
              {!filteredMembers.length && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    {loading ? "Loading members..." : loadError ? "Members could not be loaded." : "No members match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
    {selectedMemberId !== null && (
      <MemberDetailsModal
        member={selectedMember}
        allocations={allocations}
        shareLoadError={shareLoadError}
        loading={loadingDetails}
        error={detailError}
        onClose={() => {
          setSelectedMemberId(null);
          setSelectedMember(null);
          setDetailError("");
        }}
      />
    )}
    </>
  );
}