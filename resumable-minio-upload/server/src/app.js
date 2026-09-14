import express from "express";
import cors from "cors";

import uploadRoutes from "./routes/upload.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

app.use("/api/upload", uploadRoutes);

export default app;
