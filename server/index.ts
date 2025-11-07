import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import emailRoutes from "./routes/emailRoutes.js";
import webhookRoutes from "./routes/webhookRoutesFixed.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Webhook routes (proxy to n8n)
  app.use("/webhook", webhookRoutes);

  // Email/Microsoft Auth routes
  app.use("/", emailRoutes);
  app.use("/api/email", emailRoutes);

  return app;
}
