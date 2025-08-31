import * as XLSX from 'xlsx';

export interface ParsedSpreadsheetData {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV content into headers and rows
 */
export function parseCSV(csvContent: string): ParsedSpreadsheetData {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('File must contain header and at least one data row');
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    rows.push(values);
  }

  return { headers, rows };
}

/**
 * Parse Excel file buffer into headers and rows
 */
export function parseExcel(buffer: Buffer): ParsedSpreadsheetData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('Excel file contains no worksheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

    if (jsonData.length < 2) {
      throw new Error('File must contain header and at least one data row');
    }

    const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
    const rows = jsonData.slice(1).map(row => 
      row.map(cell => String(cell || '').trim())
    );

    return { headers, rows };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.');
  }
}

/**
 * Parse spreadsheet file based on mime type or file extension
 */
export function parseSpreadsheetFile(buffer: Buffer, fileName: string, mimeType?: string): ParsedSpreadsheetData {
  const isExcel = mimeType?.includes('spreadsheetml') || 
                  mimeType?.includes('ms-excel') || 
                  fileName.toLowerCase().endsWith('.xlsx') || 
                  fileName.toLowerCase().endsWith('.xls');

  if (isExcel) {
    return parseExcel(buffer);
  } else {
    // Assume CSV
    const csvContent = buffer.toString('utf-8');
    return parseCSV(csvContent);
  }
}

/**
 * Smart CSV line parsing function (handles quoted fields)
 */
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
