// src/Pages/loans/LoanCalculator.jsx
import { useState } from "react";
import { formatIndianCurrency } from "../../utils/formHelpers";

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(12); // Annual %
  const [tenureMonths, setTenureMonths] = useState(12); // Months
  const [schedule, setSchedule] = useState([]);

  const calculateLoan = (e) => {
    e.preventDefault();
    const principal = Number(loanAmount);
    const monthlyRate = Number(interestRate) / 12 / 100;
    const months = Number(tenureMonths);

    if (principal <= 0 || monthlyRate <= 0 || months <= 0) return;

    // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    let balance = principal;
    let generatedSchedule = [];

    for (let i = 1; i <= months; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      generatedSchedule.push({
        month: i,
        emi: emi.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        balance: Math.max(balance, 0).toFixed(2),
      });
    }

    setSchedule(generatedSchedule);
  };

  const totalPayment = schedule.reduce((sum, row) => sum + Number(row.emi), 0);
  const totalInterest = schedule.reduce((sum, row) => sum + Number(row.interest), 0);
  const monthlyEMI = schedule.length > 0 ? schedule[0].emi : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm font-sans">

      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <span className="text-xs font-black text-teal-700 uppercase tracking-wider">Financial Tools</span>
        <h2 className="text-2xl font-black text-[#102a43] m-0 font-serif">Loan Amortization &amp; EMI Calculator</h2>
        <p className="text-slate-500 text-xs mt-1">Compute precise monthly repayment schedules, interest breakdown, and total loan costs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Form Input Panel */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#102a43]">Loan Parameters</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount (₹)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Annual Interest Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tenure (Months)</label>
            <input
              type="number"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <button
            onClick={calculateLoan}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm cursor-pointer"
          >
            Calculate Amortization Schedule
          </button>

          {schedule.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Monthly EMI:</span>
                <strong className="text-slate-900 font-serif">₹{Number(monthlyEMI).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Interest:</span>
                <strong className="text-rose-600 font-serif">{formatIndianCurrency(totalInterest)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Payable:</span>
                <strong className="text-teal-800 font-serif">{formatIndianCurrency(totalPayment)}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right Schedule Table Panel */}
        <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-2xl max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-serif">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3">EMI (₹)</th>
                <th className="p-3">Principal (₹)</th>
                <th className="p-3">Interest (₹)</th>
                <th className="p-3 text-right">Balance Due (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schedule.length > 0 ? (
                schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">Month {row.month}</td>
                    <td className="p-3 font-semibold text-slate-800">₹{Number(row.emi).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-semibold text-emerald-600">₹{Number(row.principal).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-semibold text-rose-600">₹{Number(row.interest).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{Number(row.balance).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 font-medium">
                    Enter loan parameters on the left and click calculate to generate the repayment schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}