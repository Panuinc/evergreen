async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function get(url) {
  return apiRequest(url);
}

export function post(url, body) {
  return apiRequest(url, { method: "POST", body: JSON.stringify(body) });
}

export function put(url, body) {
  return apiRequest(url, { method: "PUT", body: JSON.stringify(body) });
}

export function patch(url, body) {
  return apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function del(url) {
  return apiRequest(url, { method: "DELETE" });
}
