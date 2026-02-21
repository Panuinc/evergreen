/**
 * Test direct HTTP login to BCI SSO.
 * Follow the full redirect chain to get JWT token.
 */

const BASE = "https://sso.bcicentral.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let allCookies = {};

function parseCookies(headers) {
  const raw = headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const [name, ...rest] = pair.split("=");
    allCookies[name.trim()] = rest.join("=");
  }
}

function cookieHeader() {
  return Object.entries(allCookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

function resolveUrl(base, relative) {
  if (relative.startsWith("http")) return relative;
  return new URL(relative, base).toString();
}

async function main() {
  // Step 1: GET login page
  console.log("1. GET login page...");
  const r1 = await fetch(`${BASE}/login?app=lm`, {
    redirect: "manual",
    headers: { "User-Agent": UA },
  });
  console.log(`   ${r1.status}`);
  parseCookies(r1);
  const html = await r1.text();

  // Parse hidden inputs
  const hiddenInputs = {};
  const inputRegex = /<input[^>]+type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*?)"/gi;
  let m;
  while ((m = inputRegex.exec(html)) !== null) {
    hiddenInputs[m[1]] = m[2];
    console.log(`   Hidden: ${m[1]} = ${m[2].substring(0, 50)}`);
  }
  // Also try reversed order (value before name)
  const inputRegex2 = /<input[^>]+value="([^"]*?)"[^>]*name="([^"]+)"/gi;
  while ((m = inputRegex2.exec(html)) !== null) {
    if (!hiddenInputs[m[2]]) {
      hiddenInputs[m[2]] = m[1];
      console.log(`   Hidden: ${m[2]} = ${m[1].substring(0, 50)}`);
    }
  }

  // Step 2: POST login form
  console.log("\n2. POST login form...");
  const formData = new URLSearchParams(hiddenInputs);
  formData.append("username", "chh_thailand");
  formData.append("password", "CHH_Thailand");

  const r2 = await fetch(`${BASE}/login?app=lm`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      Cookie: cookieHeader(),
      Referer: `${BASE}/login?app=lm`,
      Origin: BASE,
    },
    body: formData.toString(),
  });
  console.log(`   ${r2.status} → ${r2.headers.get("location")}`);
  parseCookies(r2);

  // Step 3: Follow redirect to get "Multiple Logins" page
  const redir1 = resolveUrl(BASE, r2.headers.get("location") || "");
  console.log(`\n3. Following redirect: ${redir1}`);
  const r3 = await fetch(redir1, {
    redirect: "manual",
    headers: { "User-Agent": UA, Cookie: cookieHeader() },
  });
  console.log(`   ${r3.status}`);
  parseCookies(r3);

  const html2 = await r3.text();
  console.log(`   Body length: ${html2.length}`);
  console.log(`   Contains 'Switch': ${html2.includes("Switch to This Device")}`);
  console.log(`   Contains 'Multiple': ${html2.includes("Multiple Logins")}`);

  // Find "Switch to This Device" link
  const switchMatch = html2.match(/href="([^"]*)"[^>]*>(?:[^<]*Switch to This Device|Switch to This Device)/i)
    || html2.match(/<a[^>]+href="([^"]*)"[^>]*>\s*(?:<[^>]+>\s*)*Switch to This Device/i);

  if (switchMatch) {
    console.log(`   Switch link: ${switchMatch[1]}`);

    // Follow the switch link
    console.log("\n4. Following Switch to This Device link...");
    const switchUrl = resolveUrl(BASE, switchMatch[1]);
    const r4 = await fetch(switchUrl, {
      redirect: "manual",
      headers: { "User-Agent": UA, Cookie: cookieHeader(), Referer: redir1 },
    });
    console.log(`   ${r4.status} → ${r4.headers.get("location")}`);
    parseCookies(r4);

    let nextUrl = r4.headers.get("location");
    let step = 5;

    // Follow all redirects
    while (nextUrl) {
      const fullUrl = resolveUrl(BASE, nextUrl);
      console.log(`\n${step}. Following: ${fullUrl.substring(0, 120)}`);

      const res = await fetch(fullUrl, {
        redirect: "manual",
        headers: { "User-Agent": UA, Cookie: cookieHeader() },
      });
      console.log(`   ${res.status} → ${res.headers.get("location")}`);
      parseCookies(res);

      // Check for auth_code
      if (fullUrl.includes("auth_code")) {
        console.log(`\n   AUTH_CODE found in URL!`);
        const codeMatch = fullUrl.match(/auth_code=([^&]+)/);
        if (codeMatch) {
          console.log(`   Code: ${codeMatch[1]}`);
          // Try to exchange for JWT
          await tryLoginSso(codeMatch[1]);
        }
      }

      if (res.headers.get("location")?.includes("auth_code")) {
        const loc = res.headers.get("location");
        console.log(`\n   AUTH_CODE in redirect!`);
        const codeMatch = loc.match(/auth_code=([^&]+)/);
        if (codeMatch) {
          console.log(`   Code: ${codeMatch[1]}`);
          await tryLoginSso(codeMatch[1]);
        }
      }

      nextUrl = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      step++;
      if (step > 15) break;
    }
  } else {
    // Maybe the login was successful without Multiple Logins
    console.log("   No 'Switch to This Device' found");

    // Check for redirect to app
    if (html2.includes("auth_code") || html2.includes("callback")) {
      console.log("   Found auth_code/callback references");
    }

    // Try parsing any links
    const links = [];
    const linkRegex = /href="([^"]+)"/g;
    while ((m = linkRegex.exec(html2)) !== null) {
      links.push(m[1]);
    }
    console.log(`   Links found: ${links.length}`);
    for (const l of links) console.log(`     ${l.substring(0, 100)}`);

    // Check body for relevant content
    console.log(`\n   Body preview: ${html2.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 500)}`);
  }
}

async function tryLoginSso(authCode) {
  console.log("\n=== Trying to exchange auth_code for JWT ===");

  // Try with the auth code
  const endpoints = [
    { url: "https://api-nlm.bcicentral.com/api/v2/account/login/sso", body: { auth_code: authCode, source: "sso" } },
    { url: "https://api-nlm.bcicentral.com/api/v2/account/login/sso", body: { authCode, source: "sso" } },
    { url: "https://api-nlm.bcicentral.com/api/v2/account/login/sso", body: { code: authCode } },
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        "x-source": "asia",
      },
      body: JSON.stringify(ep.body),
    });
    console.log(`   [${res.status}] ${JSON.stringify(ep.body).substring(0, 80)}`);
    const text = await res.text();
    console.log(`   ${text.substring(0, 300)}`);
  }
}

main().catch(console.error);
