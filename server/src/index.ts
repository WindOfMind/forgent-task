import { config } from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { logger } from "./logger.ts";
import { database } from "./db.ts";

config({ path: ".env.local" });

// Initialize the database
await database.init();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Winston logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    url: req.path,
  });
  next();
});

const port: number = process.env["PORT"] ? parseInt(process.env["PORT"]) : 3001;

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function (_req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = async (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// upload file
app.post("/api/tender/file", upload.single("file"), async (req, res) => {
  if (!req.file) {
    logger.warn("No file uploaded or file is not a PDF");
    return res.status(400).send("No file uploaded or file is not a PDF.");
  }

  try {
    // Save file info to database
    const fileId = await database.addFile(req.file.path, req.file.originalname);
    return res.status(200).json({
      success: true,
      message: `File uploaded successfully`,
      fileId,
      path: req.file.path,
    });
  } catch (error) {
    logger.error("Error saving file information to database", { error });
    return res.status(500).json({ error: "Failed to process uploaded file" });
  }
});

// add question
app.post("/api/tender/question", async (req: Request, res: Response) => {
  const { question } = req.body;

  logger.info("Processing /api/tender/question/add request", { question });

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

  // Save question to database
  try {
    const id = await database.addQuestion(question);
    res.status(200).json({ success: true, id });
  } catch (error) {
    logger.error("Failed to save question", { error });
    res.status(500).json({ error: "Failed to save question" });
  }
});

// Get all questions
app.get("/api/tender/questions", (_req: Request, res: Response) => {
  try {
    const questions = database.getAllQuestions();
    res.status(200).json({ questions });
  } catch (error) {
    logger.error("Failed to get questions", { error });
    res.status(500).json({ error: "Failed to get questions" });
  }
});

// Get all files
app.get("/api/tender/files", (_req: Request, res: Response) => {
  try {
    const files = database.getAllFiles();
    res.status(200).json({ files });
  } catch (error) {
    logger.error("Failed to get files", { error });
    res.status(500).json({ error: "Failed to get files" });
  }
});

app.listen(port, () => {
  logger.info(`🚀 Server is running at http://localhost:${port}`, {
    port,
    environment: process.env["NODE_ENV"] || "development",
  });
});

export { app };
