"use strict";
/* POST /api/test - check that the mailbox credentials work, without sending anything. */

const nodemailer = require("nodemailer");

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(obj),
});

function classify(err) {
  const code = String(err.code || "");
  const resp = String(err.response || "") + " " + String(err.message || "");
  if (code === "EAUTH" || /\b535\b/.test(resp)) return "auth";
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET|EDNS/i.test(code + " " + resp)) return "network";
  return "unknown";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  let p;
  try {
    p = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid JSON body", ecode: "unknown" });
  }

  const { smtp, auth } = p;
  if (!smtp || !smtp.host) return json(400, { error: "missing smtp host", ecode: "unknown" });
  if (!auth || !auth.user || !auth.pass) return json(400, { error: "missing credentials", ecode: "auth" });

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 465,
    secure: smtp.secure !== false,
    auth: { user: auth.user, pass: auth.pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 9000,
    tls: { minVersion: "TLSv1.2" },
  });

  try {
    await transporter.verify();
    return json(200, { ok: true, user: auth.user });
  } catch (e) {
    const ecode = classify(e);
    const detail = [e.code, e.response || e.message].filter(Boolean).join(" ").slice(0, 300);
    console.log("auth test failed for", auth.user, ecode);
    return json(400, { error: detail, ecode });
  } finally {
    transporter.close();
  }
};
