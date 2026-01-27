import axios from "axios";

// Health endpoints to ping
const HEALTH_ENDPOINTS = [
  process.env.API_GATEWAY_URL || "https://api.adorss.ng",
  process.env.AUTH_SERVICE_URL || "http://auth.adorss.ng",
  // Add more service URLs as needed
  // process.env.EDUCATION_SERVICE_URL || "https://education.adorss.com",
  // process.env.MESSAGING_SERVICE_URL || "https://messaging.adorss.com",
  // process.env.FINANCE_SERVICE_URL || "https://finance.adorss.com",
  // process.env.MOBILITY_SERVICE_URL || "https://mobility.adorss.com",
];

const HEALTH_PATH = "/health";
const PING_INTERVAL_SECONDS = 14; // Ping every 14 seconds

/**
 * Ping a single health endpoint
 */
async function pingHealthEndpoint(baseUrl: string): Promise<void> {
  try {
    const url = `${baseUrl}${HEALTH_PATH}`;
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        "User-Agent": "HealthCheckCron/1.0",
      },
    });

    console.log(
      `[${new Date().toISOString()}] ✓ Health check passed: ${url} (${response.status})`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[${new Date().toISOString()}] ✗ Health check failed for ${baseUrl}: ${errorMessage}`,
    );
  }
}

/**
 * Ping all health endpoints
 */
async function pingAllEndpoints(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting health checks...`);

  try {
    await Promise.all(HEALTH_ENDPOINTS.map(pingHealthEndpoint));
  } catch (error) {
    console.error("Error during health check batch:", error);
  }
}

/**
 * Start the cron job
 */
function startCronJob(): void {
  // Convert 14 seconds to cron expression
  // node-cron doesn't support seconds directly in standard cron format
  // We'll use a simpler approach with setInterval for precise 14-second intervals
  console.log(
    `[${new Date().toISOString()}] Health check cron job started (interval: ${PING_INTERVAL_SECONDS}s)`,
  );
  console.log(`[${new Date().toISOString()}] Monitoring endpoints:`);
  HEALTH_ENDPOINTS.forEach((endpoint) => {
    console.log(`  - ${endpoint}${HEALTH_PATH}`);
  });

  // Ping immediately on startup
  pingAllEndpoints();

  // Set up interval for continuous pinging
  setInterval(pingAllEndpoints, PING_INTERVAL_SECONDS * 1000);
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown(): void {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(
        `\n[${new Date().toISOString()}] ${signal} received. Shutting down gracefully...`,
      );
      process.exit(0);
    });
  });
}

// Start the application
startCronJob();
setupGracefulShutdown();

// Keep the process alive
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
