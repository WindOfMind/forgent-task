import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import { logger } from "./logger.ts";

type DbSchema = {
  questions: Array<{
    id: string;
    text: string;
    createdAt: string;
    status: "pending" | "answered";
  }>;
  files: Array<{
    id: string;
    anthropicFileId: string;
    originalName: string;
    createdAt: string;
    fileSize: number;
  }>;
};

class Database {
  private db: Low<DbSchema>;

  constructor() {
    const adapter = new JSONFile<DbSchema>("data/db.json");
    this.db = new Low(adapter, { questions: [], files: [] });
  }

  async init(): Promise<void> {
    try {
      await this.db.read();
      this.db.data ||= { questions: [], files: [] };
      await this.db.write();
      logger.info("Database initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize database", { error });
      throw error;
    }
  }

  async addQuestion(question: string): Promise<string> {
    try {
      const id = Date.now().toString();

      this.db.data.questions.push({
        id,
        text: question,
        createdAt: new Date().toISOString(),
        status: "pending",
      });

      await this.db.write();
      logger.info("Question added to database", { id });

      return id;
    } catch (error) {
      logger.error("Failed to add question to database", { error });
      throw error;
    }
  }

  getAllQuestions() {
    return this.db.data.questions;
  }

  async addFile(
    anthropicFileId: string,
    originalName: string,
    fileSize: number
  ): Promise<string> {
    const existingFile = this.db.data.files.find(
      (file) => file.originalName === originalName
    );

    if (existingFile) {
      logger.info("File with the same name already exists", {
        originalName,
        existingFileId: existingFile.anthropicFileId,
      });

      return existingFile.id;
    }

    try {
      const id = Date.now().toString();

      this.db.data.files.push({
        id,
        anthropicFileId,
        originalName,
        fileSize,
        createdAt: new Date().toISOString(),
      });

      // Enforce retention policy - keep only the 3 most recent files
      await this.enforceFileRetentionPolicy();

      await this.db.write();
      logger.info("File added to database", { id, anthropicFileId });

      return id;
    } catch (error) {
      logger.error("Failed to add file to database", { error });
      throw error;
    }
  }

  async enforceFileRetentionPolicy(): Promise<void> {
    try {
      // Sort files by creation date (newest first)
      const sortedFiles = [...this.db.data.files].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // If we have more than 3 files, remove the oldest ones
      if (sortedFiles.length > 3) {
        // const filesToRemove = sortedFiles.slice(3);

        // Update database to keep only the 3 newest files
        this.db.data.files = sortedFiles.slice(0, 3);

        // Log the files that will be removed
        // for (const file of filesToRemove) {
        //   logger.info("Removed old file from database", {
        //     id: file.id,
        //     anthropicFileId: file.anthropicFileId,
        //     originalName: file.originalName,
        //   });
        // Note: We should also delete the files from Anthropic's servers
        // This would be done through the AnthropicClient
        // }
      }
    } catch (error) {
      logger.error("Error enforcing file retention policy", { error });
      throw error;
    }
  }

  getAllFiles() {
    return this.db.data.files;
  }

  findFileByOriginalName(originalName: string) {
    return this.db.data.files.find(
      (file) => file.originalName === originalName
    );
  }

  getFileById(id: string) {
    return this.db.data.files.find((file) => file.id === id);
  }
}

export const database = new Database();
