import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { apiRouter } from "./routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
  }),
);
app.use(express.json());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
