import { type Student, type InsertStudent, type SeatingChart, type InsertSeatingChart, students, seatingCharts } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  deleteAllStudents(): Promise<void>;
  createStudentsBatch(students: InsertStudent[]): Promise<Student[]>;

  // Seating Charts
  getSeatingCharts(): Promise<SeatingChart[]>;
  getSeatingChart(id: string): Promise<SeatingChart | undefined>;
  createSeatingChart(chart: InsertSeatingChart): Promise<SeatingChart>;
  updateSeatingChart(id: string, chart: Partial<InsertSeatingChart>): Promise<SeatingChart | undefined>;
  deleteSeatingChart(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private seatingCharts: Map<string, SeatingChart>;

  constructor() {
    this.students = new Map();
    this.seatingCharts = new Map();
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent & {id?: string}): Promise<Student> {
    // Use provided ID if available (for restoring saved data), otherwise generate new one
    const id = insertStudent.id || randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      secondaryLanguages: insertStudent.secondaryLanguages || [],
      worksWellWith: insertStudent.worksWellWith || [],
      avoidPairing: insertStudent.avoidPairing || [],
      notes: insertStudent.notes || ""
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    
    const updated: Student = { 
      ...existing, 
      ...updateData,
      id: existing.id,
      secondaryLanguages: updateData.secondaryLanguages !== undefined ? updateData.secondaryLanguages : existing.secondaryLanguages,
      worksWellWith: updateData.worksWellWith !== undefined ? updateData.worksWellWith : existing.worksWellWith,
      avoidPairing: updateData.avoidPairing !== undefined ? updateData.avoidPairing : existing.avoidPairing,
      notes: updateData.notes !== undefined ? updateData.notes : existing.notes
    };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  async deleteAllStudents(): Promise<void> {
    this.students.clear();
  }

  async createStudentsBatch(students: (InsertStudent & {id?: string})[]): Promise<Student[]> {
    const createdStudents: Student[] = [];
    for (const insertStudent of students) {
      const student = await this.createStudent(insertStudent);
      createdStudents.push(student);
    }
    return createdStudents;
  }

  // Seating Charts
  async getSeatingCharts(): Promise<SeatingChart[]> {
    return Array.from(this.seatingCharts.values());
  }

  async getSeatingChart(id: string): Promise<SeatingChart | undefined> {
    return this.seatingCharts.get(id);
  }

  async createSeatingChart(insertChart: InsertSeatingChart): Promise<SeatingChart> {
    const id = randomUUID();
    const chart: SeatingChart = {
      ...insertChart,
      id,
      seats: (insertChart.seats || []) as {position: number, studentId: string | null, customX?: number, customY?: number}[],
      students: (insertChart.students || []) as {id: string, name: string, primaryLanguage: string, skillLevel: string, worksWellWith: string[], avoidPairing: string[], notes: string}[],
      createdAt: new Date().toISOString()
    };
    this.seatingCharts.set(id, chart);
    return chart;
  }

  async updateSeatingChart(id: string, updateData: Partial<InsertSeatingChart>): Promise<SeatingChart | undefined> {
    const existing = this.seatingCharts.get(id);
    if (!existing) return undefined;

    const updated: SeatingChart = {
      ...existing,
      ...updateData,
      id: existing.id,
      createdAt: existing.createdAt,
      seats: (updateData.seats !== undefined ? updateData.seats : existing.seats) as {position: number, studentId: string | null, customX?: number, customY?: number}[],
      students: (updateData.students !== undefined ? updateData.students : existing.students) as {id: string, name: string, primaryLanguage: string, skillLevel: string, worksWellWith: string[], avoidPairing: string[], notes: string}[]
    };
    this.seatingCharts.set(id, updated);
    return updated;
  }

  async deleteSeatingChart(id: string): Promise<boolean> {
    return this.seatingCharts.delete(id);
  }
}

export class SQLiteStorage implements IStorage {
  // Students
  async getStudents(): Promise<Student[]> {
    return db.select().from(students).all();
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = db.select().from(students).where(eq(students.id, id)).get();
    return result || undefined;
  }

  async createStudent(insertStudent: InsertStudent & {id?: string}): Promise<Student> {
    const id = insertStudent.id || randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      worksWellWith: insertStudent.worksWellWith || [],
      avoidPairing: insertStudent.avoidPairing || [],
      notes: insertStudent.notes || ""
    };
    db.insert(students).values(student).run();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const existing = await this.getStudent(id);
    if (!existing) return undefined;

    const updated: Student = {
      ...existing,
      ...updateData,
      id: existing.id,
      worksWellWith: updateData.worksWellWith !== undefined ? updateData.worksWellWith : existing.worksWellWith,
      avoidPairing: updateData.avoidPairing !== undefined ? updateData.avoidPairing : existing.avoidPairing,
      notes: updateData.notes !== undefined ? updateData.notes : existing.notes
    };
    db.update(students).set(updated).where(eq(students.id, id)).run();
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = db.delete(students).where(eq(students.id, id)).run();
    return result.changes > 0;
  }

  async deleteAllStudents(): Promise<void> {
    db.delete(students).run();
  }

  async createStudentsBatch(studentList: (InsertStudent & {id?: string})[]): Promise<Student[]> {
    const createdStudents: Student[] = [];
    for (const insertStudent of studentList) {
      const student = await this.createStudent(insertStudent);
      createdStudents.push(student);
    }
    return createdStudents;
  }

  // Seating Charts
  async getSeatingCharts(): Promise<SeatingChart[]> {
    return db.select().from(seatingCharts).all();
  }

  async getSeatingChart(id: string): Promise<SeatingChart | undefined> {
    const result = db.select().from(seatingCharts).where(eq(seatingCharts.id, id)).get();
    return result || undefined;
  }

  async createSeatingChart(insertChart: InsertSeatingChart): Promise<SeatingChart> {
    const id = randomUUID();
    const chart: SeatingChart = {
      ...insertChart,
      id,
      seats: insertChart.seats || [],
      students: insertChart.students || [],
      createdAt: new Date().toISOString()
    };
    db.insert(seatingCharts).values(chart).run();
    return chart;
  }

  async updateSeatingChart(id: string, updateData: Partial<InsertSeatingChart>): Promise<SeatingChart | undefined> {
    const existing = await this.getSeatingChart(id);
    if (!existing) return undefined;

    const updated: SeatingChart = {
      ...existing,
      ...updateData,
      id: existing.id,
      createdAt: existing.createdAt,
      seats: updateData.seats !== undefined ? updateData.seats : existing.seats,
      students: updateData.students !== undefined ? updateData.students : existing.students
    };
    db.update(seatingCharts).set(updated).where(eq(seatingCharts.id, id)).run();
    return updated;
  }

  async deleteSeatingChart(id: string): Promise<boolean> {
    const result = db.delete(seatingCharts).where(eq(seatingCharts.id, id)).run();
    return result.changes > 0;
  }
}

export const storage = new SQLiteStorage();