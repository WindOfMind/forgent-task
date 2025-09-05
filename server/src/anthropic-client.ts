import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { logger } from "./logger.ts";
import fs from "fs";

// Define file upload response
interface FileUploadResponse {
  fileId: string;
}

export class AnthropicClient {
  private client: Anthropic;
  private defaultModel: string;
  private maxTokens: number;

  constructor(apiKey: string, maxTokens?: number) {
    this.client = new Anthropic({
      apiKey,
      // Add beta feature header for Files API
      defaultHeaders: {
        "anthropic-beta": "files-api-2025-04-14",
      },
    });

    this.defaultModel = "claude-3-opus-20240229";
    this.maxTokens = maxTokens ?? 1024;

    logger.info("Anthropic client initialized", {
      model: this.defaultModel,
      maxTokens: this.maxTokens,
    });
  }

  /**
   * Upload a file to Anthropic's Files API
   * @param filePath Path to the file to upload
   * @returns A promise with the file ID and size
   */
  async uploadFile(buffer: Buffer): Promise<FileUploadResponse> {
    try {
      logger.info("Uploading file to Anthropic");

      const response = await this.client.beta.files.upload({
        file: await toFile(buffer, undefined, {
          type: "application/pdf",
        }),
        betas: ["files-api-2025-04-14"],
      });

      return {
        fileId: response.id,
      };
    } catch (error) {
      logger.error("Error uploading file to Anthropic", { error });
      throw error;
    }
  }
}
