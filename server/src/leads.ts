
import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const leadsRouter = Router();

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  value: z.number().positive(),
  status: z.enum(["New", "Contacted", "Qualified", "Won"]).default("New"),
});
const leadUpdateSchema = leadSchema.partial().extend({
  status: z.enum(["New", "Contacted", "Qualified", "Won"]).optional(),
});

type Lead = z.infer<typeof leadSchema> & { id: string };

const leads: Lead[] = [
  {
    id: "lead-1",
    name: "Aarav Mehta",
    company: "Nexora Technologies",
    email: "aarav@nexora.example",
    value: 85000,
    status: "Qualified",
  },
  {
    id: "lead-2",
    name: "Priya Sharma",
    company: "BluePeak Solutions",
    email: "priya@bluepeak.example",
    value: 62000,
    status: "Contacted",
  },
  {
    id: "lead-3",
    name: "Rohan Desai",
    company: "Vertex Industries",
    email: "rohan@vertex.example",
    value: 120000,
    status: "New",
  },
  {
    id: "lead-4",
    name: "Sneha Kapoor",
    company: "Orbit Systems",
    email: "sneha@orbit.example",
    value: 95000,
    status: "Qualified",
  },
  {
    id: "lead-5",
    name: "Kabir Joshi",
    company: "Greenline Retail",
    email: "kabir@greenline.example",
    value: 44000,
    status: "Won",
  },
];

leadsRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const status = String(req.query.status ?? "").trim();

  const data = leads.filter((lead) => {
    const searchable = `${lead.name} ${lead.company} ${lead.email}`.toLowerCase();
    return searchable.includes(search) && (!status || lead.status === status);
  });

  res.json({ data, total: data.length });
});

leadsRouter.post("/", (req, res) => {
  const parsed = leadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid lead data",
      details: parsed.error.flatten(),
    });
  }

  const lead: Lead = { ...parsed.data, id: randomUUID() };
  leads.push(lead);

  return res.status(201).json({ data: lead });
});

leadsRouter.patch("/:id", (req, res) => {
  const lead = leads.find((item) => item.id === req.params.id);

  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const parsed = leadUpdateSchema.safeParse(req.body);

  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return res.status(400).json({
      error: "Invalid lead data",
      ...(parsed.success ? {} : { details: parsed.error.flatten() }),
    });
  }

  Object.assign(lead, parsed.data);
  return res.json({ data: lead });
});

leadsRouter.delete("/:id", (req, res) => {
  const index = leads.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  leads.splice(index, 1);
  return res.status(204).end();
});
