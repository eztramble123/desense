import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config";
import { initChain } from "./services/chain";
import { startIndexer } from "./services/indexer";
import { apiKeyAuth } from "./middleware/auth";

// Routes
import assetsRouter from "./routes/assets";
import batchesRouter from "./routes/batches";
import mapRouter from "./routes/map";
import statsRouter from "./routes/stats";
import complianceRouter from "./routes/compliance";
import ingestRouter from "./routes/ingest";

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "5mb" }));
app.use(apiKeyAuth);

// Routes
app.use("/api/assets", assetsRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/map", mapRouter);
app.use("/api/stats", statsRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/ingest", ingestRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", chain: config.chainId, timestamp: Date.now() });
});

async function main() {
  console.log("Zeus Backend Starting...");
  console.log(`Chain: ADI Testnet (${config.chainId})`);
  console.log(`RPC: ${config.rpcUrl}`);

  // Initialize chain connections
  if (config.contracts.deviceRegistry) {
    initChain();
    console.log("Chain service initialized");

    // Start event indexer
    startIndexer().catch((err) => {
      console.error("Indexer failed to start:", err.message);
    });
  } else {
    console.warn("No contract addresses configured — running without chain connection");
  }

  app.listen(config.port, () => {
    console.log(`Zeus Backend listening on port ${config.port}`);
    console.log(`API: http://localhost:${config.port}/api`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
