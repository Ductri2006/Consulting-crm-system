import type { Server } from "node:http";

import { app } from "./app";
import { env } from "./config/env";

const HOST = "0.0.0.0";

const server: Server = app.listen(env.PORT, HOST, () => {
  console.log(`Backend server is running on http://${HOST}:${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`${signal} received. Shutting down gracefully.`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close the HTTP server.", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
