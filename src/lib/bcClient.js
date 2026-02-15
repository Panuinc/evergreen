let tokenCache = { accessToken: null, expiresAt: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const res = await fetch(process.env.BC_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.BC_CLIENT_ID,
      client_secret: process.env.BC_CLIENT_SECRET,
      scope: process.env.BC_SCOPE,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BC token request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

const BC_BASE_URL = `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}/${process.env.BC_ENVIRONMENT}/api/v2.0`;

export async function bcGet(endpoint, params = {}) {
  const token = await getToken();

  const url = new URL(`${BC_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BC API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data.value || []).map(sanitizeKeys);
}

function sanitizeKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sanitizeKeys);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_x0020_/g, ""),
        sanitizeKeys(v),
      ]),
    );
  }
  return obj;
}
