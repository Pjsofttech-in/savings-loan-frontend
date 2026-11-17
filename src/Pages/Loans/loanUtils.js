export const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 2,
})}`;

export function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetweenDates(startDate, endDate = new Date()) {
  if (!startDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(localDateString(endDate) + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

export function outstandingAmount(loan) {
  return Math.max(0, (Number(loan.totalPayable) || Number(loan.amount) || 0) - (Number(loan.paidAmount) || 0));
}

export function loanStatus(loan) {
  return String(loan.status || "Pending");
}

export function isLoanOverdue(loan) {
  return ["Approved", "Active"].includes(loanStatus(loan))
    && outstandingAmount(loan) > 0
    && daysBetweenDates(loan.dueDate) > 0;
}
