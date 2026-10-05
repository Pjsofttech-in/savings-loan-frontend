import { useEffect, useMemo, useState } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import { fetchMemberById, fetchMembers } from "../services/memberService";
import { fetchShareAllocations } from "../services/shareService";

const initialFilters = { memberType: "All", year: "All", city: "All", status: "All" };

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

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchMembers()
        .then((data) => { if (isMounted) setMembers(data); })
        .catch((error) => { if (isMounted) setLoadError(error.message); }),
      fetchShareAllocations()
        .then((data) => { if (isMounted) setAllocations(data); })
        .catch((error) => { if (isMounted) setShareLoadError(error.message); }),
    ]).finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, []);

  const memberTypes = [...new Set(members.map((member) => member.memberType).filter(Boolean))].sort();
  const years = [...new Set(members.map((member) => member.membershipYear).filter(Boolean))].sort();
  const cities = [...new Set(members.map((member) => member.city).filter(Boolean))].sort();
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
      && (filters.memberType === "All" || member.memberType === filters.memberType)
      && (filters.year === "All" || member.membershipYear === filters.year)
      && (filters.city === "All" || member.city === filters.city)
      && (filters.status === "All" || member.status === filters.status);
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

  if (selectedMemberId !== null) {
    const memberShares = allocations
      .filter((allocation) => String(allocation.memberId) === String(selectedMemberId))
      .sort((left, right) => String(right.applicationDate || "").localeCompare(String(left.applicationDate || "")));
    const totalShares = memberShares.reduce((total, allocation) => total + (Number(allocation.numberOfShares) || 0), 0);
    const totalShareValue = memberShares.reduce((total, allocation) => total + (Number(allocation.paymentAmount) || 0), 0);
    const status = selectedMember?.status || "Unknown";
    const normalizedStatus = status.toLocaleLowerCase();
    const statusClass = normalizedStatus === "active"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : ["suspended", "terminated", "inactive", "disactive"].includes(normalizedStatus)
        ? "bg-red-50 text-red-800 border-red-200"
        : "bg-amber-50 text-amber-800 border-amber-200";

    return (
      <main className="max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">
        <button
          type="button"
          onClick={() => {
            setSelectedMemberId(null);
            setSelectedMember(null);
            setDetailError("");
          }}
          className="mb-5 text-sm font-semibold text-teal-800 hover:text-teal-950"
        >
          ← Back to members
        </button>
        {loadingDetails && <p className="py-12 text-center text-sm text-slate-500">Loading member details...</p>}
        {detailError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{detailError}</p>}
        {selectedMember && (
          <>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Member Profile</span>
                <h1 className="mt-1 text-2xl font-extrabold text-[#102a43]">{selectedMember.fullName || "Member"}</h1>
                <p className="mt-1 font-mono text-sm text-slate-500">Member ID: {selectedMember.id}</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-bold ${statusClass}`}>
                {status}
              </span>
            </header>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="space-y-5 xl:col-span-2">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="mb-5 text-base font-bold text-slate-900">Personal background</h2>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Father / spouse name" value={selectedMember.fatherName} />
                    <DetailItem label="Date of birth" value={formatDate(selectedMember.birthDate)} />
                    <DetailItem label="Gender" value={selectedMember.gender} />
                    <DetailItem label="Occupation" value={selectedMember.occupation} />
                    <DetailItem label="Mobile" value={selectedMember.mobile} />
                    <DetailItem label="Email" value={selectedMember.email} />
                    <DetailItem label="Address" value={selectedMember.address} />
                    <DetailItem label="City" value={selectedMember.city} />
                  </dl>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="mb-5 text-base font-bold text-slate-900">Nominee relationship</h2>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <DetailItem label="Nominee" value={selectedMember.nomineeName} />
                    <DetailItem label="Relationship" value={selectedMember.nomineeRelationship} />
                    <DetailItem label="Nominee mobile" value={selectedMember.nomineeMobile} />
                  </dl>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900">Share relationship</h2>
                    <span className="text-xs text-slate-500">{totalShares} shares · {formatIndianCurrency(totalShareValue)}</span>
                  </div>
                  {shareLoadError ? (
                    <p role="status" className="text-sm text-amber-800">Share history unavailable: {shareLoadError}</p>
                  ) : memberShares.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-[620px] w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs text-slate-500">
                          <tr>
                            <th className="py-2 pr-4">Applied</th>
                            <th className="py-2 pr-4">Share type</th>
                            <th className="py-2 pr-4">Units</th>
                            <th className="py-2 pr-4">Payment</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {memberShares.map((allocation) => (
                            <tr key={allocation.id}>
                              <td className="py-3 pr-4">{formatDate(allocation.applicationDate)}</td>
                              <td className="py-3 pr-4">{allocation.shareType || "-"}</td>
                              <td className="py-3 pr-4">{allocation.numberOfShares}</td>
                              <td className="py-3 pr-4">{formatIndianCurrency(allocation.paymentAmount)}</td>
                              <td className="py-3">{allocation.paymentStatus || "Unknown"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No share allocations are recorded for this member.</p>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="mb-5 text-base font-bold text-slate-900">Membership with the group</h2>
                  <dl className="space-y-4">
                    <DetailItem label="Member type" value={selectedMember.memberType} />
                    <DetailItem label="Membership year" value={selectedMember.membershipYear} />
                    <DetailItem label="Joined" value={formatDate(selectedMember.joiningDate)} />
                    <DetailItem label="Account status" value={status} />
                    <DetailItem label="Registration payment reference" value={selectedMember.paymentId} />
                    <DetailItem label="ID proof type" value={selectedMember.documentType} />
                  </dl>
                </section>
                <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-sm font-bold text-slate-900">Loan records</h2>
                  <p className="mt-2 text-sm text-slate-600">Loan account history is not stored in the current member records.</p>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">
      <header className="mb-5 pb-4 border-b border-slate-200 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Member Directory</span>
          <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Members</h1>
        </div>
        <span className="h-10 px-4 inline-flex items-center rounded-full border border-teal-700 text-teal-800 text-sm font-semibold">
          Total: {filteredMembers.length}
        </span>
      </header>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
          <input
            aria-label="Search members"
            className="h-11 px-4 border border-slate-300 rounded-md text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 sm:col-span-2 xl:col-span-2"
            placeholder="Search ID, name, mobile, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {[ ["memberType", "Member Type", memberTypes], ["year", "Joining Year", years], ["city", "City", cities] ].map(([key, label, options]) => (
            <select
              key={key}
              aria-label={label}
              className="h-11 px-3 border border-slate-300 rounded-md bg-white text-sm text-slate-700 outline-none focus:border-teal-600"
              value={filters[key]}
              onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
            >
              <option value="All">All {label}s</option>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ))}
          <select
            aria-label="Member status"
            className="h-11 px-3 border border-slate-300 rounded-md bg-white text-sm text-slate-700 outline-none focus:border-teal-600"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="All">All Statuses</option>
            {[...new Set(members.map((member) => member.status).filter(Boolean))].sort().map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {(search || Object.values(filters).some((value) => value !== "All")) && (
          <button type="button" onClick={clearFilters} className="mb-4 text-xs font-semibold text-teal-800 hover:text-teal-950">
            Clear filters
          </button>
        )}
        {loadError && <p className="mb-4 text-sm text-red-700" role="alert">{loadError}</p>}
        {shareLoadError && <p className="mb-4 text-sm text-amber-800" role="status">Share totals unavailable: {shareLoadError}</p>}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[1120px] w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#6495ed] text-white font-bold">
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile No.</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Member Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Joining Date</th>
                <th className="px-4 py-3 text-right">Individual Share Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.map((member, index) => (
                <tr key={member.id} className={index % 2 === 0 ? "bg-[#f7f7f7]" : "bg-white"}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                    <button type="button" onClick={() => openMemberDetails(member.id)} className="text-left text-teal-800 hover:underline">
                      {member.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <button type="button" onClick={() => openMemberDetails(member.id)} className="text-left hover:text-teal-800 hover:underline">
                      {member.fullName || "-"}
                    </button>
                  </td>
                  <td className="px-4 py-3">{member.mobile || "-"}</td>
                  <td className="px-4 py-3">{member.email || "-"}</td>
                  <td className="px-4 py-3">{member.memberType || "-"}</td>
                  <td className="px-4 py-3">{member.city || "-"}</td>
                  <td className="px-4 py-3">{formatDate(member.joiningDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {shareLoadError ? "-" : formatIndianCurrency(shareAmounts.get(String(member.id)) || 0)}
                  </td>
                </tr>
              ))}
              {!filteredMembers.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    {loading ? "Loading members..." : loadError ? "Members could not be loaded." : "No members match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}