import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

app.use(cors());

app.get("/health", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

app.use("/api", uploadRoutes);

export default app;
