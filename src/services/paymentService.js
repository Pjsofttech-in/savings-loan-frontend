import apiClient from "./apiClient";

async function request(path, options = {}) {
  const { body, ...requestOptions } = options;
  try {
    const { data } = await apiClient.request({
      url: path,
      ...requestOptions,
      data: body,
      headers: {
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...requestOptions.headers,
      },
    });
    return data;
  } catch (error) {
    if (!error.response) {
      throw new Error(
        `Payment API at ${apiClient.defaults.baseURL} is unreachable or blocked. Restart the backend and verify its CORS settings.`,
        { cause: error },
      );
    }

    const responseData = error.response.data || {};
    const message = responseData.detail || responseData.message || (error.response.status === 503
      ? "Registration fee or payment credentials are not configured."
      : "The server could not process this request.");
    throw new Error(message, { cause: error });
  }
}

export function getPaymentConfiguration() {
  return request("/api/payments/config");
}

export function saveRegistrationFee(amount, adminPassword) {
  return request("/api/payments/registration-fee", {
    method: "PUT",
    body: JSON.stringify({ amount }),
    headers: { "X-Admin-Password": adminPassword },
  });
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