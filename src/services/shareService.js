const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export async function fetchShareAllocations() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/shares`);
  } catch {
    throw new Error("Could not connect to the share allocation service.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Could not load share allocations.");
  }
  return Array.isArray(data) ? data : [];
}

export async function createShareAllocation(allocation) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allocation),
    });
  } catch {
    throw new Error("Could not connect to the share allocation service. Check that the backend is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Could not save the share allocation.");
  }
  return data;
}
