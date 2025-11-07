import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Track active connections
let connections = new Set();

server.on('connection', (conn) => {
  connections.add(conn);
  conn.on('close', () => connections.delete(conn));
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close Redis connection if it exists
  try {
    const { redisConnection } = await import('./services/redisClient.js');
    await redisConnection.disconnect();
  } catch (err) {
    console.warn('⚠️  Redis cleanup skipped:', err);
  }

  // Force close remaining connections after 10 seconds
  setTimeout(() => {
    console.warn('⏱️  Forcing shutdown after timeout');
    connections.forEach(conn => conn.destroy());
    process.exit(1);
  }, 10000);

  // Drain existing connections (max 8 seconds)
  const shutdownStart = Date.now();
  while (connections.size > 0 && Date.now() - shutdownStart < 8000) {
    console.log(`⏳ Waiting for ${connections.size} active connections...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
