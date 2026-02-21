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

const BC_ODATA_URL = `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}/${process.env.BC_ENVIRONMENT}/ODataV4/Company('C.H.H._Go-Live')`;

// BC API v2.0 (standard REST API — for dimensionValues, etc.)
const BC_COMPANY_ID = "a407ba9f-2151-ec11-9f09-000d3ac85269";
const BC_API_URL = `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}/${process.env.BC_ENVIRONMENT}/api/v2.0/companies(${BC_COMPANY_ID})`;

export async function bcApiGet(endpoint, params = {}) {
  const token = await getToken();

  const url = new URL(`${BC_API_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const allValues = [];
  let nextUrl = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl, {
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
    allValues.push(...(data.value || []));
    nextUrl = data["@odata.nextLink"] || null;
  }

  return allValues;
}

export async function bcODataGet(entity, params = {}) {
  const token = await getToken();

  const url = new URL(`${BC_ODATA_URL}/${entity}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const allValues = [];
  let nextUrl = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BC OData error: ${res.status} ${text}`);
    }

    const data = await res.json();
    allValues.push(...(data.value || []));
    nextUrl = data["@odata.nextLink"] || null;
  }

  return allValues;
}
