export function getTotalShareValue(membershipDetails) {
  return (
    (Number(membershipDetails.shares) || 0) *
    (Number(membershipDetails.shareValue) || 0)
  );
}

export function formatIndianCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getSectionErrors(errors, section) {
  return Object.fromEntries(
    Object.entries(errors)
      .filter(([key]) => key.startsWith(`${section}.`))
      .map(([key, value]) => [key.split(".")[1], value]),
  );
}
