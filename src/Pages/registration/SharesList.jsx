// src/Pages/shares/SharesList.jsx
import { useState, useEffect } from "react";
import { formatIndianCurrency } from "../../utils/formHelpers";
import { fetchShareAllocations } from "../../services/shareService";

export default function SharesList() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sharesRecords, setSharesRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetchShareAllocations()
      .then((records) => {
        if (isMounted) setSharesRecords(records);
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);
  const totalSharesCount = sharesRecords.reduce((sum, s) => sum + (Number(s.numberOfShares) || 0), 0);
  const totalCapitalPool = sharesRecords.reduce((sum, s) => sum + (Number(s.paymentAmount) || 0), 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
      
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Shares Capital Registry</span>
          <h2 className="text-[#102a43] text-xl font-bold m-0 font-serif">Allotted Shares Records</h2>
          <p className="text-slate-500 text-xs mt-1">Review all member share allocations, capital contributions, and payment verification IDs.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
            Total Allotted: {totalSharesCount} Shares
          </span>
          <span className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            Capital Pool: {formatIndianCurrency(totalCapitalPool)}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-serif">
              <th className="p-3">Folio ID</th>
              <th className="p-3">Member Name</th>
              <th className="p-3">Share Category</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Face Value</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Payment Mode</th>
              <th className="p-3">Reference / UTR</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sharesRecords.length > 0 ? (
              sharesRecords.map((record) => {
                const qty = Number(record.numberOfShares) || 1;
                const fv = Number(record.faceValue) || 0;
                const amt = Number(record.paymentAmount) || 0;
                
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{record.memberId}</td>
                    <td className="p-3 font-bold text-slate-900">{record.memberName || record.user || "Member"}</td>
                    <td className="p-3 text-slate-700 font-semibold">{record.shareType || "Ordinary Shares"}</td>
                    <td className="p-3 text-slate-900 font-bold">{qty}</td>
                    <td className="p-3 text-slate-600">₹{fv.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-extrabold text-[#102a43]">{formatIndianCurrency(amt)}</td>
                    <td className="p-3 text-slate-700">{record.paymentMode || record.paymentMethod || "Bank Transfer"}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{record.referenceNumber || record.transactionId || "N/A"}</td>
                    <td className="p-3 text-slate-600">{record.applicationDate || record.date || "2026-09-24"}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        (record.status || record.paymentStatus) === "Approved" || (record.status || record.paymentStatus) === "Complete"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {record.status || record.paymentStatus || "Approved"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="p-6 text-center text-slate-400">
                  {loading ? "Loading shares records from database..." : loadError || "No shares records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}