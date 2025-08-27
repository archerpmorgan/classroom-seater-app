import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  primaryLanguage: text("primary_language").notNull(),
  secondaryLanguages: jsonb("secondary_languages").$type<string[]>().default([]),
  skillLevel: text("skill_level").notNull(), // 'beginner', 'intermediate', 'advanced'
  worksWellWith: jsonb("works_well_with").$type<string[]>().default([]),
  avoidPairing: jsonb("avoid_pairing").$type<string[]>().default([]),
  notes: text("notes").default(""),
});

export const seatingCharts = pgTable("seating_charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  layout: text("layout").notNull(), // 'rows', 'groups', 'u-shape'
  strategy: text("strategy").notNull(), // 'mixed', 'skill-based', 'language-support', etc.
  seats: jsonb("seats").$type<{position: number, studentId: string | null}[]>().notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertSeatingChartSchema = createInsertSchema(seatingCharts).omit({
  id: true,
  createdAt: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type SeatingChart = typeof seatingCharts.$inferSelect;
export type InsertSeatingChart = z.infer<typeof insertSeatingChartSchema>;

// CSV upload schema for validation
export const csvStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  primaryLanguage: z.string().min(1, "Primary language is required"),
  secondaryLanguages: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
  ),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  worksWellWith: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
  ),
  avoidPairing: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
  ),
  notes: z.string().optional().default(""),
});

export type CSVStudent = z.infer<typeof csvStudentSchema>;
