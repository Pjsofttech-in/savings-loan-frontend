import apiClient from "./apiClient";

export async function fetchShareAllocations() {
  try {
    const { data } = await apiClient.get("/api/shares");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.detail ||
          error.response.data?.message ||
          "Could not load share allocations.",
        { cause: error },
      );
    }
    throw new Error("Could not connect to the share allocation service.", {
      cause: error,
    });
  }
}

export async function createShareAllocation(allocation) {
  try {
    const { data } = await apiClient.post("/api/shares", allocation);
    return data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.detail ||
          error.response.data?.message ||
          "Could not save the share allocation.",
        { cause: error },
      );
    }
    throw new Error(
      "Could not connect to the share allocation service. Check that the backend is running.",
      { cause: error },
    );
  }
}