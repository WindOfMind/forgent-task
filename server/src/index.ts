import { config } from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.ts";

config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Winston logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    url: req.path,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

const port: number = process.env["PORT"] ? parseInt(process.env["PORT"]) : 3001;

app.post("/api/question/add", (req: Request, res: Response) => {
  const { question } = req.body;

  logger.info("Processing /api/question/add request", { question });

  if (typeof question !== "string") {
    logger.warn("Invalid question parameter", {
      question,
      type: typeof question,
    });

    res
      .status(400)
      .json({ error: "Missing or invalid 'text' property in request body." });

    return;
  }

  res.status(200);
});

app.listen(port, () => {
  logger.info(`🚀 Server is running at http://localhost:${port}`, {
    port,
    environment: process.env["NODE_ENV"] || "development",
  });
});

export { app };
