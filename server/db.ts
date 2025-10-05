import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { students, seatingCharts } from "@shared/schema";

const sqlite = new Database("database.db");
export const db = drizzle(sqlite, { schema: { students, seatingCharts } });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_language TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    works_well_with TEXT NOT NULL DEFAULT '[]',
    avoid_pairing TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS seating_charts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    layout TEXT NOT NULL,
    strategy TEXT NOT NULL,
    seats TEXT NOT NULL,
    students TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
