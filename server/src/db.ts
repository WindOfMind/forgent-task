import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import { logger } from "./logger.ts";

type DbSchema = {
  questions: Array<{
    id: string;
    text: string;
    createdAt: string;
    answers?: Array<{
      answer: string;
      createdAt: string;
    }>;
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

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      // Check if the question exists
      const questionIndex = this.db.data.questions.findIndex(
        (question) => question.id === id
      );

      if (questionIndex === -1) {
        logger.warn("Question not found for deletion", { id });
        return false;
      }

      // Remove the question from the array
      this.db.data.questions.splice(questionIndex, 1);

      await this.db.write();
      logger.info("Question deleted from database", { id });

      return true;
    } catch (error) {
      logger.error("Failed to delete question from database", { error, id });
      throw error;
    }
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

  getQuestionById(id: string) {
    return this.db.data.questions.find((question) => question.id === id);
  }

  async addAnswerToQuestion(
    questionId: string,
    answer: string
  ): Promise<boolean> {
    try {
      const question = this.getQuestionById(questionId);

      if (!question) {
        logger.warn("Question not found for adding answer", { questionId });
        return false;
      }

      // Initialize answers array if it doesn't exist
      if (!question.answers) {
        question.answers = [];
      }

      // Add the answer to the question
      question.answers.push({
        answer,
        createdAt: new Date().toISOString(),
      });

      await this.db.write();
      logger.info("Answer added to question", { questionId });

      return true;
    } catch (error) {
      logger.error("Failed to add answer to question", {
        error,
        questionId,
      });
      throw error;
    }
  }
}

export const database = new Database();
