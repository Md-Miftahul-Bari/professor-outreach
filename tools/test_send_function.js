// End-to-end test of netlify/functions/send.js against a local SMTP sink.
const net = require("net");
const path = require("path");

const PORT = 2525;
const messages = [];

const server = net.createServer((sock) => {
  let inData = false, data = "", buf = "";
  sock.write("220 test-sink ESMTP\r\n");
  sock.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    let idx;
    while ((idx = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (inData) {
        if (line === ".") { inData = false; messages.push(data); data = ""; sock.write("250 queued\r\n"); }
        else data += line + "\n";
        continue;
      }
      const up = line.toUpperCase();
      if (up.startsWith("EHLO") || up.startsWith("HELO")) {
        sock.write("250-test-sink\r\n250-SIZE 10485760\r\n250-8BITMIME\r\n250 OK\r\n");
      } else if (up.startsWith("MAIL FROM")) sock.write("250 ok\r\n");
      else if (up.startsWith("RCPT TO")) sock.write("250 ok\r\n");
      else if (up.startsWith("DATA")) { inData = true; sock.write("354 go ahead\r\n"); }
      else if (up.startsWith("QUIT")) { sock.write("221 bye\r\n"); sock.end(); }
      else if (up.startsWith("RSET")) sock.write("250 ok\r\n");
      else sock.write("250 ok\r\n");
    }
  });
  sock.on("error", () => {});
});

(async () => {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const { handler } = require(path.join(__dirname, "..", "netlify", "functions", "send.js"));

  const cv = Buffer.from("%PDF-1.4 fake cv content").toString("base64");
  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      smtp: { host: "127.0.0.1", port: PORT, secure: false },
      auth: null,
      from_email: "sender@example.com",
      from_name: "Wang Xiaoming",
      to: "prof@example.edu",
      to_name: "Shimin HU",
      subject: "2027年秋季硕士申请咨询：计算机图形学",
      body: "尊敬的Hu老师：\n\n您好！...\n\n此致\n敬礼！\n\n王小明",
      attachments: [{ name: "CV.pdf", type: "application/pdf", b64: cv }],
    }),
  };

  const res = await handler(event);
  console.log("status:", res.statusCode);
  const payload = JSON.parse(res.body);
  console.log("ok:", payload.ok, "| messageId:", payload.messageId ? "present" : "missing");

  console.log("messages received by sink:", messages.length);
  const raw = messages[0] || "";
  const hasSubject = /Subject: /.test(raw);
  const hasTo = /To: .*prof@example\.edu/i.test(raw) || raw.includes("prof@example.edu");
  const hasCv = /filename=\S*CV\.pdf/i.test(raw) || raw.includes("CV.pdf");
  const hasCjk = raw.includes("=?UTF-8?B?") || raw.includes("=?utf-8?b?") || raw.includes("计算机图形学");
  console.log("has Subject header:", hasSubject, "| has recipient:", hasTo, "| has CV attachment:", hasCv, "| subject encoded:", hasCjk);

  // malformed input must be rejected, not crash
  const bad = await handler({ httpMethod: "POST", body: "{not json" });
  console.log("bad json ->", bad.statusCode);
  const missing = await handler({ httpMethod: "POST", body: JSON.stringify({ smtp: { host: "x" } }) });
  console.log("missing fields ->", missing.statusCode);

  const ok = res.statusCode === 200 && payload.ok && messages.length === 1 && hasSubject && hasCv &&
             bad.statusCode === 400 && missing.statusCode === 400;
  server.close();
  console.log(ok ? "\nOK: send function assembles and delivers the message" : "\nFAIL");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error("ERROR", e); process.exit(1); });
