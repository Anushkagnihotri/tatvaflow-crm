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

  it("searches leads by name, company, or email without case sensitivity", async () => {
    const response = await request(server)
      .get("/api/leads")
      .query({ search: "NEXORA" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Aarav Mehta");
  });

  it("filters leads by status", async () => {
    const response = await request(server)
      .get("/api/leads")
      .query({ status: "Qualified" });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((lead: { status: string }) => lead.status === "Qualified")).toBe(true);
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

  it("rejects invalid and empty lead updates", async () => {
    const invalidStatus = await request(server)
      .patch("/api/leads/lead-1")
      .send({ status: "Archived" });
    const emptyUpdate = await request(server)
      .patch("/api/leads/lead-1")
      .send({});

    expect(invalidStatus.status).toBe(400);
    expect(invalidStatus.body.error).toBe("Invalid lead data");
    expect(emptyUpdate.status).toBe(400);
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

  it("updates a lead and returns the updated data", async () => {
    const response = await request(server)
      .patch("/api/leads/lead-1")
      .send({ status: "Contacted" });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("lead-1");
    expect(response.body.data.status).toBe("Contacted");
  });

  it("deletes a lead and reports missing leads", async () => {
    const created = await request(server)
      .post("/api/leads")
      .send({
        name: "Delete Test",
        company: "Example Company",
        email: "delete-test@example.com",
        value: 1000,
      });
    const id = created.body.data.id as string;
    const deleted = await request(server).delete(`/api/leads/${id}`);
    const missing = await request(server).delete(`/api/leads/${id}`);

    expect(created.status).toBe(201);
    expect(deleted.status).toBe(204);
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("Lead not found");
  });
});