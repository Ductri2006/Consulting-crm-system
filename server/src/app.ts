import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { apiRouter } from "./routes";
import { redactSensitiveText } from "./utils/redact";

const app = express();
const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity:
      env.NODE_ENV === "production"
        ? {
            maxAge: 15552000,
            includeSubDomains: true,
          }
        : false,
  }),
);
app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

if (env.NODE_ENV === "development") {
  morgan.token("safe-url", (request) => {
    const expressRequest = request as typeof request & {
      originalUrl?: string;
    };

    return redactSensitiveText(expressRequest.originalUrl ?? request.url ?? "");
  });
  app.use(
    morgan(":method :safe-url :status :response-time ms - :res[content-length]"),
  );
}

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
