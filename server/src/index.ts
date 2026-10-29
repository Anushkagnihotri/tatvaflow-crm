
import express from "express";
import cors from "cors";
import { leadsRouter } from "./leads.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TatvaFlow API" });
});

app.use("/api/leads", leadsRouter);

const port = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`TatvaFlow API running on port ${port}`);
  });
}

export default app;
