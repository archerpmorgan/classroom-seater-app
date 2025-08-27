import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, csvStudentSchema, insertSeatingChartSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Students endpoints
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid student data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create student" });
      }
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid student data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update student" });
      }
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStudent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.delete("/api/students", async (req, res) => {
    try {
      await storage.deleteAllStudents();
      res.json({ message: "All students deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete students" });
    }
  });

  // CSV upload endpoint
  app.post("/api/students/upload-csv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain header and at least one data row" });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['name', 'primarylanguage', 'secondarylanguages', 'skilllevel', 'workswellwith', 'avoidpairing', 'notes'];
      
      // Map CSV headers to schema fields
      const headerMap: Record<string, string> = {
        'name': 'name',
        'primarylanguage': 'primaryLanguage',
        'primary_language': 'primaryLanguage',
        'secondarylanguages': 'secondaryLanguages',
        'secondary_languages': 'secondaryLanguages',
        'skilllevel': 'skillLevel',
        'skill_level': 'skillLevel',
        'workswellwith': 'worksWellWith',
        'works_well_with': 'worksWellWith',
        'avoidpairing': 'avoidPairing',
        'avoid_pairing': 'avoidPairing',
        'notes': 'notes'
      };

      const students = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const studentData: any = {};
        headers.forEach((header, index) => {
          const mappedField = headerMap[header.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()];
          if (mappedField) {
            studentData[mappedField] = values[index];
          }
        });

        try {
          const validatedStudent = csvStudentSchema.parse(studentData);
          students.push(validatedStudent);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Row ${i + 1}: ${error.errors.map(e => e.message).join(', ')}`);
          }
        }
      }

      if (errors.length > 0 && students.length === 0) {
        return res.status(400).json({ message: "No valid students found", errors });
      }

      const createdStudents = await storage.createStudentsBatch(students);
      
      res.json({
        message: `Successfully imported ${createdStudents.length} students`,
        students: createdStudents,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Seating Charts endpoints
  app.get("/api/seating-charts", async (req, res) => {
    try {
      const charts = await storage.getSeatingCharts();
      res.json(charts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seating charts" });
    }
  });

  app.post("/api/seating-charts", async (req, res) => {
    try {
      const validatedData = insertSeatingChartSchema.parse(req.body);
      const chart = await storage.createSeatingChart(validatedData);
      res.json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid seating chart data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create seating chart" });
      }
    }
  });

  app.put("/api/seating-charts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSeatingChartSchema.partial().parse(req.body);
      const chart = await storage.updateSeatingChart(id, validatedData);
      
      if (!chart) {
        return res.status(404).json({ message: "Seating chart not found" });
      }
      
      res.json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid seating chart data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update seating chart" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
