import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index.js";

describe("POST /api/question/add", () => {
  it("should return items for valid question", async () => {
    const response = await request(app)
      .post("/api/question/add")
      .send({ question: "test" })
      .set("Accept", "application/json");
    expect(response.status).toBe(200);
  });

  it("should return 400 for missing question", async () => {
    const response = await request(app)
      .post("/api/question/add")
      .send({})
      .set("Accept", "application/json");
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/question/);
  });

  it("should return 400 for non-string question", async () => {
    const response = await request(app)
      .post("/api/question/add")
      .send({ question: 123 })
      .set("Accept", "application/json");
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/question/);
  });
});
