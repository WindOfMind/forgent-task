import { config } from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "./logger.ts";
import { database } from "./db.ts";
import { AnthropicClient } from "./anthropic-client.ts";

config({ path: ".env.local" });

// Initialize the database
await database.init();
const anthropicClient = new AnthropicClient(
  process.env["ANTHROPIC_API_KEY"] || "",
  process.env["ANTHROPIC_MAX_TOKENS"]
    ? parseInt(process.env["ANTHROPIC_MAX_TOKENS"])
    : undefined
);
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

const storage = multer.memoryStorage();

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
    // Save file to Anthropic
    const { fileId } = await anthropicClient.uploadFile(req.file.buffer);
    const dbFileId = await database.addFile(
      fileId,
      req.file.originalname,
      req.file.size
    );
    return res.status(200).json({
      success: true,
      message: `File uploaded successfully`,
      fileId: dbFileId,
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

app.post("/api/tender/submit", async (_req: Request, res: Response) => {
  try {
    // Get all files
    const files = database.getAllFiles();

    if (files.length === 0) {
      return res.status(404).json({
        error: "No files found to process the question against.",
      });
    }
    const questions = database.getAllQuestions();

    for (const file of files) {
      try {
        for (const question of questions) {
          if (file.answers?.some((a) => a.questionId === question.id)) {
            continue;
          }

          const answer = await anthropicClient.askQuestionAboutFile(
            file.anthropicFileId,
            question.text
          );

          await database.addAnswerToFile(
            file.id,
            question.id,
            question.text,
            answer
          );
        }
      } catch (fileError) {
        logger.error("Error processing question for file", {
          fileId: file.id,
          error: fileError,
        });
      }
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    logger.error("Failed to process question submission", { error });
    return res
      .status(500)
      .json({ error: "Failed to process question submission" });
  }
});

app.listen(port, () => {
  logger.info(`🚀 Server is running at http://localhost:${port}`, {
    port,
    environment: process.env["NODE_ENV"] || "development",
  });
});

// Get answers for a specific file
app.get("/api/tender/file/:fileId/answers", (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    const file = database.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.status(200).json({
      fileId,
      fileName: file.originalName,
      answers: file.answers || [],
    });
  } catch (error) {
    logger.error("Failed to get file answers", { error });
    return res.status(500).json({ error: "Failed to get file answers" });
  }
});

export { app };
