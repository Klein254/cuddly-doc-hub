import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: fs.existsSync('.env') ? '.env' : '.env.example' });

// Contact-form records are deleted after this many days (see Privacy Policy).
const RETENTION_DAYS = 365;
const LIMITS = { name: 100, email: 200, phone: 30, message: 3000 };

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware. The site and API share one origin, so no CORS headers are needed.
  app.use(express.json({ limit: "20kb" }));
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // hosted behind one proxy (Cloud Run), so req.ip is the visitor's IP
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  // Local JSON store for enquiries.
  // Use /tmp in production because the Cloud Run container is read-only
  const DB_PATH = process.env.NODE_ENV === "production"
    ? path.join("/tmp", "database.json")
    : path.join(process.cwd(), "database.json");

  // Initialize DB file
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ contacts: [] }), "utf-8");
  }

  // Simple per-IP rate limit: 5 submissions per 10 minutes.
  const hits = new Map<string, number[]>();
  const rateLimited = (ip: string) => {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > 5;
  };

  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  // API Route: Contact Form
  app.post("/api/contact", async (req, res) => {
    try {
      if (rateLimited(req.ip || "unknown")) {
        return res.status(429).json({ error: "Too many messages in a short time. Please try again in a few minutes, or email us directly." });
      }

      // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
      if (req.body?.website) {
        return res.status(200).json({ success: true });
      }

      const name = clean(req.body?.name, LIMITS.name);
      const email = clean(req.body?.email, LIMITS.email);
      const phone = clean(req.body?.phone, LIMITS.phone);
      const message = clean(req.body?.message, LIMITS.message);
      const policyVersion = clean(req.body?.policyVersion, 20);

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
      if (req.body?.consent !== true) {
        return res.status(400).json({ error: "Please confirm you agree to us using your details to reply." });
      }

      // 1. Save to the local store, dropping anything past the retention period.
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
      data.contacts = (data.contacts || []).filter((c: { createdAt: string }) => new Date(c.createdAt).getTime() >= cutoff);
      const now = new Date().toISOString();
      data.contacts.push({
        id: Date.now().toString(),
        name,
        email,
        phone,
        message,
        consent: { given: true, at: now, policyVersion },
        createdAt: now,
      });
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");

      // 2. Email notification via NodeMailer (needs SMTP credentials in .env)
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const destEmail = process.env.CONTACT_EMAIL || "vectortech254@gmail.com";

      if (smtpUser && smtpPass && smtpUser !== "your-email@gmail.com") {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Vector Technical Website" <${smtpUser}>`,
          to: destEmail,
          replyTo: email,
          subject: `New website enquiry from ${name}`,
          text: `You have a new message from your website.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\nMessage:\n${message}\n\nConsent to be contacted: given at ${now} (privacy policy version ${policyVersion || "unknown"}).`,
        });
        console.log("Contact form: notification email sent.");
      } else {
        // Don't write personal data to logs.
        console.log("Contact form: stored a new enquiry (no SMTP credentials set, email not sent).");
      }

      res.status(200).json({ success: true, message: "Message sent and stored successfully!" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Something went wrong on our side. Please try again later, or email us directly." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
