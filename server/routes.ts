import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, csvStudentSchema, insertSeatingChartSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parseSpreadsheetFile } from "./file-parser";

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

  // Smart CSV parsing function
  function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Spreadsheet upload endpoint (supports CSV and Excel)
  app.post("/api/students/upload-csv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse the uploaded file (CSV or Excel)
      const { headers, rows } = parseSpreadsheetFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      
      // Map CSV headers to schema fields with flexible matching
      const headerMap: Record<string, string> = {
        'name': 'name',
        'student': 'name',
        'studentname': 'name',
        'fullname': 'name',
        'primarylanguage': 'primaryLanguage',
        'primary_language': 'primaryLanguage',
        'language': 'primaryLanguage',
        'mainlanguage': 'primaryLanguage',
        'secondarylanguages': 'secondaryLanguages',
        'secondary_languages': 'secondaryLanguages',
        'otherlanguages': 'secondaryLanguages',
        'additionallanguages': 'secondaryLanguages',
        'skilllevel': 'skillLevel',
        'skill_level': 'skillLevel',
        'level': 'skillLevel',
        'ability': 'skillLevel',
        'workswellwith': 'worksWellWith',
        'works_well_with': 'worksWellWith',
        'partners': 'worksWellWith',
        'goodwith': 'worksWellWith',
        'friends': 'worksWellWith',
        'avoidpairing': 'avoidPairing',
        'avoid_pairing': 'avoidPairing',
        'avoid': 'avoidPairing',
        'separate': 'avoidPairing',
        'dontpairwith': 'avoidPairing',
        'notes': 'notes',
        'comments': 'notes',
        'additional': 'notes',
        'info': 'notes'
      };

      const students = [];
      const errors = [];
      const warnings = [];

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i];
        
        // Smart column count handling
        const expectedColumns = headers.length;
        if (values.length < expectedColumns) {
          // Pad with empty strings for missing columns
          while (values.length < expectedColumns) {
            values.push('');
          }
          warnings.push(`Row ${i + 2}: Added missing columns (filled with empty values)`);
        } else if (values.length > expectedColumns) {
          // Trim extra columns
          values.splice(expectedColumns);
          warnings.push(`Row ${i + 2}: Removed extra columns`);
        }

        const studentData: any = {};
        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          const mappedField = headerMap[cleanHeader];
          if (mappedField && values[index] !== undefined) {
            let value = values[index];
            
            // Clean up common formatting issues
            if (mappedField === 'skillLevel') {
              value = value.toLowerCase();
              // Handle common variations
              if (value.includes('beg') || value === 'low' || value === '1') value = 'beginner';
              if (value.includes('int') || value === 'med' || value === 'middle' || value === '2') value = 'intermediate';
              if (value.includes('adv') || value === 'high' || value === '3') value = 'advanced';
            }
            
            studentData[mappedField] = value;
          }
        });

        try {
          const validatedStudent = csvStudentSchema.parse(studentData);
          students.push(validatedStudent);
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Try to provide helpful error messages
            const errorMessages = error.errors.map(e => {
              if (e.code === 'invalid_enum_value' && e.path[0] === 'skillLevel') {
                return `Skill level must be 'beginner', 'intermediate', or 'advanced' (got '${studentData.skillLevel}')`;
              }
              return e.message;
            });
            errors.push(`Row ${i + 2}: ${errorMessages.join(', ')}`);
          }
        }
      }

      if (errors.length > 0 && students.length === 0) {
        return res.status(400).json({ message: "No valid students found", errors });
      }

      const createdStudents = await storage.createStudentsBatch(students);
      
      const response: any = {
        message: `Successfully imported ${createdStudents.length} students`,
        students: createdStudents
      };
      
      if (errors.length > 0) response.errors = errors;
      if (warnings.length > 0) response.warnings = warnings;
      
      res.json(response);
    } catch (error) {
      console.error('CSV processing error:', error);
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

  // Google Drive endpoints
  app.get("/api/google-drive/files/:folderId", async (req, res) => {
    try {
      const { folderId } = req.params;
      
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
        return res.status(500).json({ 
          message: "Google Drive integration not configured. Please set up service account credentials." 
        });
      }

      const { googleDriveService } = await import("./google-drive");
      const files = await googleDriveService.listSpreadsheetFiles(folderId);
      res.json(files);
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      res.status(500).json({ message: "Failed to list Google Drive files" });
    }
  });

  app.post("/api/students/import-from-drive", async (req, res) => {
    try {
      const { fileId } = req.body;
      
      if (!fileId) {
        return res.status(400).json({ message: "File ID is required" });
      }

      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
        return res.status(500).json({ 
          message: "Google Drive integration not configured. Please set up service account credentials." 
        });
      }

      // Download file content from Google Drive
      const { googleDriveService } = await import("./google-drive");
      const fileBuffer = await googleDriveService.downloadFileContent(fileId);
      const fileMetadata = await googleDriveService.getFileMetadata(fileId);
      
      // Parse the file (CSV or Excel)
      const { headers, rows } = parseSpreadsheetFile(fileBuffer, fileMetadata.name, fileMetadata.mimeType);
      
      // Map CSV headers to schema fields with flexible matching
      const headerMap: Record<string, string> = {
        'name': 'name',
        'student': 'name',
        'studentname': 'name',
        'fullname': 'name',
        'primarylanguage': 'primaryLanguage',
        'primary_language': 'primaryLanguage',
        'language': 'primaryLanguage',
        'mainlanguage': 'primaryLanguage',
        'secondarylanguages': 'secondaryLanguages',
        'secondary_languages': 'secondaryLanguages',
        'otherlanguages': 'secondaryLanguages',
        'additionallanguages': 'secondaryLanguages',
        'skilllevel': 'skillLevel',
        'skill_level': 'skillLevel',
        'level': 'skillLevel',
        'ability': 'skillLevel',
        'workswellwith': 'worksWellWith',
        'works_well_with': 'worksWellWith',
        'partners': 'worksWellWith',
        'goodwith': 'worksWellWith',
        'friends': 'worksWellWith',
        'avoidpairing': 'avoidPairing',
        'avoid_pairing': 'avoidPairing',
        'avoid': 'avoidPairing',
        'separate': 'avoidPairing',
        'dontpairwith': 'avoidPairing',
        'notes': 'notes',
        'comments': 'notes',
        'additional': 'notes',
        'info': 'notes'
      };

      const students = [];
      const errors = [];
      const warnings = [];

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i];
        
        // Smart column count handling
        const expectedColumns = headers.length;
        if (values.length < expectedColumns) {
          // Pad with empty strings for missing columns
          while (values.length < expectedColumns) {
            values.push('');
          }
          warnings.push(`Row ${i + 2}: Added missing columns (filled with empty values)`);
        } else if (values.length > expectedColumns) {
          // Trim extra columns
          values.splice(expectedColumns);
          warnings.push(`Row ${i + 2}: Removed extra columns`);
        }

        const studentData: any = {};
        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          const mappedField = headerMap[cleanHeader];
          if (mappedField && values[index] !== undefined) {
            let value = values[index];
            
            // Clean up common formatting issues
            if (mappedField === 'skillLevel') {
              value = value.toLowerCase();
              // Handle common variations
              if (value.includes('beg') || value === 'low' || value === '1') value = 'beginner';
              if (value.includes('int') || value === 'med' || value === 'middle' || value === '2') value = 'intermediate';
              if (value.includes('adv') || value === 'high' || value === '3') value = 'advanced';
            }
            
            studentData[mappedField] = value;
          }
        });

        try {
          const validatedStudent = csvStudentSchema.parse(studentData);
          students.push(validatedStudent);
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Try to provide helpful error messages
            const errorMessages = error.errors.map(e => {
              if (e.code === 'invalid_enum_value' && e.path[0] === 'skillLevel') {
                return `Skill level must be 'beginner', 'intermediate', or 'advanced' (got '${studentData.skillLevel}')`;
              }
              return e.message;
            });
            errors.push(`Row ${i + 2}: ${errorMessages.join(', ')}`);
          }
        }
      }

      if (errors.length > 0 && students.length === 0) {
        return res.status(400).json({ message: "No valid students found", errors });
      }

      const createdStudents = await storage.createStudentsBatch(students);
      
      const response: any = {
        message: `Successfully imported ${createdStudents.length} students from ${fileMetadata.name}`,
        students: createdStudents,
        source: {
          type: 'google-drive',
          fileName: fileMetadata.name,
          fileId: fileId
        }
      };
      
      if (errors.length > 0) response.errors = errors;
      if (warnings.length > 0) response.warnings = warnings;
      
      res.json(response);
    } catch (error) {
      console.error('Google Drive CSV import error:', error);
      res.status(500).json({ message: "Failed to import CSV from Google Drive" });
    }
  });

  app.get("/api/google-drive/verify", async (req, res) => {
    try {
      console.log('[Routes] Google Drive verification endpoint called');
      console.log('[Routes] Checking environment variables...');
      console.log('[Routes] GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
      console.log('[Routes] GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length + ')' : 'NOT SET');
      
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
        console.log('[Routes] Environment variables not configured');
        return res.json({ 
          configured: false, 
          message: "Google Drive service account credentials not configured" 
        });
      }

      console.log('[Routes] Environment variables configured, testing access...');
      const { googleDriveService } = await import("./google-drive");
      const hasAccess = await googleDriveService.verifyAccess();
      console.log('[Routes] Access verification result:', hasAccess);
      
      res.json({ 
        configured: true, 
        hasAccess,
        message: hasAccess ? "Google Drive access verified" : "Google Drive access failed"
      });
    } catch (error) {
      console.error('[Routes] Google Drive verification error:', error);
      res.json({ 
        configured: true, 
        hasAccess: false, 
        message: "Google Drive verification failed" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
