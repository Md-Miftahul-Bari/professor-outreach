"use strict";
/* POST /api/llm - fallback relay for providers that refuse browser (CORS) calls.
   Restricted to the known API hosts so this cannot be used as an open proxy. */

const ALLOWED = new Set([
  "api.deepseek.com",
  "api.openai.com",
  "api.moonshot.cn",
  "api.siliconflow.cn",
]);

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  let p;
  try {
    p = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid JSON body" });
  }

  const { url, api_key, payload } = p;
  if (!url || !api_key || !payload) return json(400, { error: "missing fields" });
  if (!/^https:\/\//i.test(url)) return json(400, { error: "https only" });

  let host;
  try {
    host = new URL(url).host;
  } catch {
    return json(400, { error: "bad url" });
  }
  if (!ALLOWED.has(host)) {
    return json(400, { error: `host not allowed for relay: ${host}` });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${api_key}` },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return json(200, { status: res.status, body: text });
  } catch (e) {
    return json(502, { error: String(e.message || e).slice(0, 200) });
  }
};
