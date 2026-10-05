const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Payment API at ${API_BASE_URL} is unreachable or blocked. Restart the backend and verify its CORS settings.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 503
      ? "Registration fee is not configured. Set a positive REGISTRATION_FEE in the backend environment and restart the API."
      : data.detail || data.message || "The server could not process this request.";
    throw new Error(message);
  }
  return data;
}

export function getPaymentConfiguration() {
  return request("/api/payments/config");
}

export function createPaymentOrder() {
  return request("/api/payments/orders", { method: "POST", body: "{}" });
}

export function completeMemberRegistration(registration) {
  return request("/api/payments/complete", {
    method: "POST",
    body: registration instanceof FormData ? registration : JSON.stringify(registration),
  });
}

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}