// src/services/paymentService.js
import apiClient from "./apiClient";

async function request(path, options = {}) {
  const { body, ...requestOptions } = options;
  try {
    const isFormData = body instanceof FormData;
    const { data } = await apiClient.request({
      url: path,
      ...requestOptions,
      data: body,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...requestOptions.headers,
      },
    });
    return data;
  } catch (error) {
    if (!error.response) {
      throw new Error(
        `Could not reach the server at ${apiClient.defaults.baseURL}. Check that the backend is running. ` +
          "If it is running, an uploaded file may be too large (limit: 10 MB per file) - try smaller files.",
        { cause: error },
      );
    }
    if (error.response.status === 413) {
      throw new Error("Uploaded file is too large. Each document must be 10 MB or smaller.", { cause: error });
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

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Returns an error message when the file is too big or of the wrong type, otherwise null. */
export function validateDocumentFile(file, label) {
  if (!file) return null;
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `${label} is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 10 MB.`;
  }
  if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
    return `${label} must be a PDF or an image (JPG, PNG, WEBP).`;
  }
  return null;
}

export function completeMemberRegistration(registration) {
  let formData = registration;
  if (!(registration instanceof FormData)) {
    formData = new FormData();
    Object.keys(registration).forEach((key) => {
      if (registration[key] !== null && registration[key] !== undefined) {
        formData.append(key, registration[key]);
      }
    });
  }

  return request("/api/payments/complete", {
    method: "POST",
    body: formData,
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