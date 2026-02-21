import Database from "better-sqlite3";
import { config } from "../config";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      device_id INTEGER PRIMARY KEY,
      device_type INTEGER NOT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      location TEXT NOT NULL,
      region TEXT NOT NULL,
      min_output INTEGER NOT NULL DEFAULT 0,
      max_output INTEGER NOT NULL DEFAULT 0,
      sampling_rate_seconds INTEGER NOT NULL DEFAULT 30,
      operator TEXT NOT NULL,
      registered_at INTEGER NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0,
      latitude REAL NOT NULL DEFAULT 0,
      longitude REAL NOT NULL DEFAULT 0,
      block_number INTEGER,
      tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS batches (
      batch_id INTEGER PRIMARY KEY,
      device_id INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      window_end INTEGER NOT NULL,
      data_root TEXT NOT NULL,
      ipfs_cid TEXT NOT NULL,
      avg_output INTEGER NOT NULL,
      uptime_bps INTEGER NOT NULL,
      submitter TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      disputed INTEGER NOT NULL DEFAULT 0,
      dispute_reason TEXT,
      block_number INTEGER,
      tx_hash TEXT,
      FOREIGN KEY (device_id) REFERENCES assets(device_id)
    );

    CREATE INDEX IF NOT EXISTS idx_batches_device ON batches(device_id);
    CREATE INDEX IF NOT EXISTS idx_batches_submitted ON batches(submitted_at);

    CREATE TABLE IF NOT EXISTS triggers (
      trigger_id INTEGER PRIMARY KEY,
      creator TEXT NOT NULL,
      beneficiary TEXT NOT NULL,
      device_id INTEGER NOT NULL,
      trigger_type INTEGER NOT NULL,
      threshold INTEGER NOT NULL,
      observation_period INTEGER NOT NULL,
      required_streak INTEGER NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      escrowed_payout TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      block_number INTEGER,
      tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY,
      buyer TEXT NOT NULL,
      device_type INTEGER NOT NULL,
      region TEXT NOT NULL,
      min_uptime_bps INTEGER NOT NULL,
      min_avg_output INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      price_per_batch TEXT NOT NULL,
      total_escrow TEXT NOT NULL,
      remaining_escrow TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      status INTEGER NOT NULL DEFAULT 0,
      block_number INTEGER,
      tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS indexer_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
