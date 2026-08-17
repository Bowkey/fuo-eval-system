import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reportsRouter from "./routes/reports.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "fuo-eval-server" });
});

app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`FUO evaluation server listening on http://localhost:${PORT}`);
});
