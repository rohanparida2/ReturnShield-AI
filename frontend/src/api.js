const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export const getProducts = () => request("/products");
export const getProduct = (id) => request(`/products/${id}`);

export const analyzeProduct = (body) =>
  request("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const getAlternatives = (id, context) =>
  request(`/products/${id}/alternatives?context=${encodeURIComponent(context)}`);

export const getEvidence = (productId, reviewId) =>
  request(`/products/${productId}/evidence/${reviewId}`);
