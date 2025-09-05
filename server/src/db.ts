import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import { logger } from "./logger.ts";
import fs from "fs/promises";
import path from "path";

// Define the database schema
type DbSchema = {
  questions: Array<{
    id: string;
    text: string;
    createdAt: string;
    status: "pending" | "answered";
  }>;
  files: Array<{
    id: string;
    path: string;
    originalName: string;
    createdAt: string;
  }>;
};

class Database {
  private db: Low<DbSchema>;

  constructor() {
    // Initialize the database with the JSONFile adapter
    const adapter = new JSONFile<DbSchema>("data/db.json");
    this.db = new Low(adapter, { questions: [], files: [] });
  }

  async init(): Promise<void> {
    try {
      // Read the database or initialize it if it doesn't exist
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

  async addFile(filePath: string, originalName: string): Promise<string> {
    const existingFile = this.db.data.files.find(
      (file) => file.originalName === originalName
    );

    if (existingFile) {
      logger.info("File with the same name already exists", {
        originalName,
        existingPath: existingFile.path,
      });

      return existingFile.id;
    }

    try {
      const id = Date.now().toString();

      // Add the new file to the database
      this.db.data.files.push({
        id,
        path: filePath,
        originalName,
        createdAt: new Date().toISOString(),
      });

      // Enforce retention policy - keep only the 3 most recent files
      await this.enforceFileRetentionPolicy();

      await this.db.write();
      logger.info("File added to database", { id, path: filePath });

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
        const filesToRemove = sortedFiles.slice(3);

        // Update database to keep only the 3 newest files
        this.db.data.files = sortedFiles.slice(0, 3);

        // Delete the actual files from the filesystem
        for (const file of filesToRemove) {
          try {
            await fs.unlink(file.path);
            logger.info("Deleted old file", { path: file.path });
          } catch (error) {
            logger.warn("Failed to delete old file", {
              path: file.path,
              error,
            });
            // Continue with next file even if this one fails
          }
        }
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
}

// Export a singleton instance
export const database = new Database();
