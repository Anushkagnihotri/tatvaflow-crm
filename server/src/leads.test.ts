import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "./index.js";

describe("TatvaFlow API", () => {
  let server: ReturnType<typeof app.listen>;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  it("returns a healthy API status", async () => {
    const response = await request(server).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns the list of leads", async () => {
    const response = await request(server).get("/api/leads");

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it("rejects a lead with invalid data", async () => {
    const response = await request(server)
      .post("/api/leads")
      .send({
        name: "",
        company: "Example Co",
        email: "not-an-email",
        value: -10,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid lead data");
  });

  it("creates a valid lead", async () => {
    const response = await request(server)
      .post("/api/leads")
      .send({
        name: "Test Lead",
        company: "Test Company",
        email: "test@example.com",
        value: 25000,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Test Lead");
    expect(response.body.data.status).toBe("New");
    expect(response.body.data.id).toBeTruthy();
  });
});