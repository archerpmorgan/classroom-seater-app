import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  primaryLanguage: text("primary_language").notNull(),
  skillLevel: text("skill_level").notNull(), // 'beginner', 'intermediate', 'advanced'
  worksWellWith: text("works_well_with", { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  avoidPairing: text("avoid_pairing", { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  notes: text("notes").notNull().default(""),
});

export const seatingCharts = sqliteTable("seating_charts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  layout: text("layout").notNull(), // 'traditional-rows', 'stadium', 'horseshoe', 'double-horseshoe', 'circle', 'groups', 'pairs'
  strategy: text("strategy").notNull(), // 'mixed-ability', 'skill-clustering', 'language-support', 'collaborative-pairs', 'attention-zone', 'behavior-management', 'random'
  seats: text("seats", { mode: 'json' }).$type<{position: number, studentId: string | null, customX?: number, customY?: number}[]>().notNull(),
  students: text("students", { mode: 'json' }).$type<{id: string, name: string, primaryLanguage: string, skillLevel: string, worksWellWith: string[], avoidPairing: string[], notes: string}[]>().notNull().default(sql`'[]'`),
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
  primaryLanguage: z.string().optional().default("English"),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  worksWellWith: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
  ),
  avoidPairing: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
  ),
  notes: z.string().optional().default(""),
});

export type CSVStudent = z.infer<typeof csvStudentSchema>;
