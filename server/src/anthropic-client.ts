import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { logger } from "./logger.ts";

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
      defaultHeaders: {
        "anthropic-beta": "files-api-2025-04-14",
      },
    });

    this.defaultModel = "claude-sonnet-4-20250514";
    this.maxTokens = maxTokens ?? 1024 * 1024 * 1024;

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

  /**
   * Ask a question about a file using Anthropic's Files API
   * @param fileId The Anthropic file ID
   * @param question The question to ask about the file
   * @returns The answer to the question as a string
   */
  async askQuestionAboutFile(
    fileIds: string[],
    question: string
  ): Promise<string> {
    try {
      logger.info("Asking question about file", { fileIds, question });

      // Note: API schema validation error in the TypeScript SDK
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokens,
        system: `You are a helpful assistant that answers questions based on document content accurately and concisely. 
          The document is about public tenders. Please provide concise answers. 
          If it is a conditional question, return just YES/NO. 
          For invalid questions, return the answer Invalid question.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Based on the document provided, please answer the following question: ${question}. Be accurate and concise.`,
              },
              // @ts-ignore
              ...fileIds.map((fileId) => ({
                type: "document",
                source: {
                  // @ts-ignore
                  type: "file",
                  file_id: fileId,
                },
              })),
            ],
          },
        ],
      });

      // Extract the text content from the response
      const answer = response.content
        .filter((block: any) => block.type === "text" && block.text)
        .map((block: any) => block.text)
        .join("\n");

      logger.info("Received answer from Anthropic", {
        fileIds,
        questionLength: question.length,
        answerLength: answer.length,
      });

      return answer;
    } catch (error) {
      logger.error("Error asking question", {
        error,
        fileIds,
        question,
      });
      throw error;
    }
  }
}
