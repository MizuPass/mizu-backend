import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { zkpassportRoutes } from "./routes/zkpassport.routes";
import { ensRoutes } from "./routes/ens.routes";
import identityRouter from "./routes/identity.routes";
import eventRouter from "./routes/event.routes";
import uploadRouter from "./routes/upload.routes";
import stealthPaymentRouter from "./routes/stealthPayment.routes";
import { eventListenerService } from "./services/eventListener.service";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
}));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.route("/api/zkpassport", zkpassportRoutes);
app.route("/api/ens", ensRoutes);
app.route("/api/identity", identityRouter);
app.route("/api/events", eventRouter);
app.route("/api/upload", uploadRouter);
app.route("/api/stealth-payments", stealthPaymentRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

const port = process.env.PORT || 3000;

console.log(`Server is running on port ${port}`);

// Start the blockchain event listener
(async () => {
  try {
    console.log('[Server] Starting blockchain event listener...');
    await eventListenerService.startListening();
    console.log('[Server] Blockchain event listener started successfully');
  } catch (error) {
    console.error('[Server] Failed to start event listener:', error);
    console.error('[Server] Event listener can be started manually via POST /api/stealth-payments/listener/start');
  }
})();

export default {
  port,
  fetch: app.fetch,
  // Increase timeout to 30 seconds for IPFS data fetching
  idleTimeout: 30,
};