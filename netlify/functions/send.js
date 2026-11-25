"use strict";
/* POST /api/send - the only server-side hop: one SMTP message per call. */

const nodemailer = require("nodemailer");

const MAX_PAYLOAD = 6 * 1024 * 1024;

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  if ((event.body || "").length > MAX_PAYLOAD) return json(413, { error: "payload too large" });

  let p;
  try {
    p = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid JSON body" });
  }

  const { smtp, auth, from_email, from_name, to, to_name, subject, body, attachments } = p;
  if (!smtp || !smtp.host) return json(400, { error: "missing smtp host" });
  if (!from_email || !to) return json(400, { error: "missing address" });
  if (!subject || !body) return json(400, { error: "missing subject or body" });
  if (body.length > 20000) return json(400, { error: "body too long" });

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 465,
    secure: smtp.secure !== false,
    auth: auth && auth.user && auth.pass ? { user: auth.user, pass: auth.pass } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 9000,
    tls: { minVersion: "TLSv1.2" },
  });

  try {
    const info = await transporter.sendMail({
      from: { name: from_name || from_email, address: from_email },
      to: to_name ? { name: to_name, address: to } : to,
      replyTo: from_email,
      subject,
      text: body,
      attachments: (attachments || []).slice(0, 3).map((a) => ({
        filename: a.name || "attachment",
        contentType: a.type || "application/octet-stream",
        content: Buffer.from(a.b64 || "", "base64"),
      })),
    });
    // log the recipient only - never the credentials
    console.log("sent to", to, info.messageId);
    return json(200, { ok: true, messageId: info.messageId });
  } catch (e) {
    const detail = [e.code, e.response || e.message].filter(Boolean).join(" ");
    const resp = String(e.response || "") + " " + String(e.message || "");
    let ecode = "unknown";
    if (e.code === "EAUTH" || /\b535\b/.test(resp)) ecode = "auth";
    else if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET|EDNS/i.test(String(e.code || "") + resp)) ecode = "network";
    else if (/\b55[0-9]\b/.test(resp)) ecode = "recipient";
    return json(400, { error: detail.slice(0, 300), ecode });
  } finally {
    transporter.close();
  }
};
