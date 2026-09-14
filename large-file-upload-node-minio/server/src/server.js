import app from "./app.js";
import { initializeMinio } from "./config/minio.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await initializeMinio();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

startServer();
