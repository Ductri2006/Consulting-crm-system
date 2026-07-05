import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { apiRouter } from "./routes";

const app = express();
const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());
const redactRequestUrl = (url: string | undefined): string =>
  (url ?? "")
    .replace(
      /(\/api\/invitations\/public\/)[^/?#]+/g,
      "$1[redacted-token]",
    )
    .replace(/(\/invite\/)[^/?#]+/g, "$1[redacted-token]");

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json());

if (env.NODE_ENV === "development") {
  morgan.token("safe-url", (request) => {
    const expressRequest = request as typeof request & {
      originalUrl?: string;
    };

    return redactRequestUrl(expressRequest.originalUrl ?? request.url);
  });
  app.use(
    morgan(":method :safe-url :status :response-time ms - :res[content-length]"),
  );
}

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
