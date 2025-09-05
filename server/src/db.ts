import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import { logger } from "./logger.ts";

// Define the database schema
type DbSchema = {
  questions: Array<{
    id: string;
    text: string;
    createdAt: string;
    status: "pending" | "answered";
  }>;
};

class Database {
  private db: Low<DbSchema>;

  constructor() {
    // Initialize the database with the JSONFile adapter
    const adapter = new JSONFile<DbSchema>("data/db.json");
    this.db = new Low(adapter, { questions: [] });
  }

  async init(): Promise<void> {
    try {
      // Read the database or initialize it if it doesn't exist
      await this.db.read();
      this.db.data ||= { questions: [] };
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
}

// Export a singleton instance
export const database = new Database();
