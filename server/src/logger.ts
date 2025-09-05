import winston from "winston";

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "express-server" },
  transports: [],
});

if (process.env["NODE_ENV"] !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

if (process.env["NODE_ENV"] === "production") {
  logger.add(new winston.transports.File({ filename: "combined.log" }));
  logger.add(
    new winston.transports.File({ filename: "error.log", level: "error" })
  );
}

export { logger };
