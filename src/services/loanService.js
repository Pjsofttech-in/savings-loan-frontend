import apiClient from "./apiClient";

export async function fetchLoans() {
  const { data } = await apiClient.get("/api/loans");
  if (!Array.isArray(data)) throw new Error("The loan service returned an invalid records list.");
  return data;
}

export async function createLoan(loan) {
  const { data } = await apiClient.post("/api/loans", loan);
  return data;
}

export async function updateLoanStatus(loanId, status) {
  const { data } = await apiClient.put(`/api/loans/${encodeURIComponent(loanId)}`, { status });
  return data;
}

export async function deleteLoan(loanId) {
  await apiClient.delete(`/api/loans/${encodeURIComponent(loanId)}`);
}

export async function fetchLoanPayments(loanId) {
  const { data } = await apiClient.get(`/api/loans/${encodeURIComponent(loanId)}/payments`);
  if (!Array.isArray(data)) throw new Error("The loan payment service returned an invalid records list.");
  return data;
}

export async function recordLoanPayment(loanId, payment) {
  const { data } = await apiClient.post(`/api/loans/${encodeURIComponent(loanId)}/payments`, payment);
  return data;
}
